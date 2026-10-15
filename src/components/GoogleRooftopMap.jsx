import React, { useState, useEffect, useRef } from 'react';
import { 
  MapPin, Navigation, Camera, ExternalLink, CheckCircle2, 
  Trash2, Upload, Crosshair, ZoomIn, Eye, Sparkles 
} from 'lucide-react';
import { api } from '../services/api';

const GOOGLE_MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyDVYXiffRklGe9hK9_of3CgC7M3g0XhQbk';

export default function GoogleRooftopMap({
  value = {},
  onChange,
  onPhotosChange,
  existingPhotos = [],
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);

  const [loadingMap, setLoadingMap] = useState(true);
  const [mapError, setMapError] = useState('');
  const [coords, setCoords] = useState({
    lat: 28.6139,
    lng: 77.2090,
  });
  const [locating, setLocating] = useState(false);
  const [snapshotUrl, setSnapshotUrl] = useState(value.mapSnapshotUrl || value.fileUrl || '');
  const [isLocationAllocated, setIsLocationAllocated] = useState(
    Boolean(value.mapSnapshotUrl || value.fileUrl)
  );
  const [savingSnapshot, setSavingSnapshot] = useState(false);
  const [photos, setPhotos] = useState(existingPhotos || []);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Sync incoming value
  useEffect(() => {
    if (value.gpsLatitude && value.gpsLongitude) {
      const parsedLat = parseFloat(value.gpsLatitude);
      const parsedLng = parseFloat(value.gpsLongitude);
      if (!isNaN(parsedLat) && !isNaN(parsedLng)) {
        setCoords({ lat: parsedLat, lng: parsedLng });
      }
    }
    if (value.mapSnapshotUrl || value.fileUrl) {
      setSnapshotUrl(value.mapSnapshotUrl || value.fileUrl);
      setIsLocationAllocated(true);
    }
  }, [value.gpsLatitude, value.gpsLongitude, value.mapSnapshotUrl, value.fileUrl]);

  useEffect(() => {
    if (existingPhotos && existingPhotos.length > 0) {
      setPhotos(existingPhotos);
    }
  }, [existingPhotos]);

  // Load Google Maps script
  useEffect(() => {
    let isMounted = true;

    function initGoogleMap() {
      if (!window.google || !window.google.maps) {
        setMapError('Google Maps SDK could not be loaded.');
        setLoadingMap(false);
        return;
      }

      if (!mapContainerRef.current) return;

      const initialLat = coords.lat || 28.6139;
      const initialLng = coords.lng || 77.2090;

      const map = new window.google.maps.Map(mapContainerRef.current, {
        center: { lat: initialLat, lng: initialLng },
        zoom: 19,
        mapTypeId: 'hybrid', // Satellite view with street labels
        tilt: 0,
        disableDefaultUI: false,
        zoomControl: true,
        streetViewControl: false,
        fullscreenControl: true,
        mapTypeControl: true,
        mapTypeControlOptions: {
          style: window.google.maps.MapTypeControlStyle.DROPDOWN_MENU,
          position: window.google.maps.ControlPosition.TOP_RIGHT,
        },
      });

      mapInstanceRef.current = map;

      const marker = new window.google.maps.Marker({
        position: { lat: initialLat, lng: initialLng },
        map: map,
        draggable: true,
        animation: window.google.maps.Animation.DROP,
        title: 'Drag to exact terrace / chhat location',
      });

      markerRef.current = marker;

      // Click on map moves marker
      map.addListener('click', (e) => {
        const newLat = e.latLng.lat();
        const newLng = e.latLng.lng();
        marker.setPosition(e.latLng);
        onPinPositionChange(newLat, newLng);
      });

      // Drag marker updates location
      marker.addListener('dragend', (e) => {
        const newLat = e.latLng.lat();
        const newLng = e.latLng.lng();
        onPinPositionChange(newLat, newLng);
      });

      setLoadingMap(false);

      // Auto-detect location on initial load if no custom coordinates
      if (!value.gpsLatitude) {
        handleDetectLocation(map, marker);
      }
    }

    if (window.google && window.google.maps) {
      initGoogleMap();
    } else {
      const existingScript = document.getElementById('google-maps-script');
      if (!existingScript) {
        const script = document.createElement('script');
        script.id = 'google-maps-script';
        script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_KEY}&libraries=places`;
        script.async = true;
        script.defer = true;
        script.onload = () => {
          if (isMounted) initGoogleMap();
        };
        script.onerror = () => {
          if (isMounted) {
            setMapError('Failed to load Google Maps API. Please check internet connection or API Key.');
            setLoadingMap(false);
          }
        };
        document.head.appendChild(script);
      } else {
        existingScript.addEventListener('load', () => {
          if (isMounted) initGoogleMap();
        });
      }
    }

    return () => {
      isMounted = false;
    };
  }, []);

  // When pin moves: updates coordinates only, does NOT take screenshot in advance!
  const onPinPositionChange = (lat, lng) => {
    const latFixed = Number(lat).toFixed(6);
    const lngFixed = Number(lng).toFixed(6);
    setCoords({ lat: Number(latFixed), lng: Number(lngFixed) });

    // Mark as unallocated / pending explicit save
    setIsLocationAllocated(false);
    setSnapshotUrl('');

    if (onChange) {
      onChange({
        gpsLatitude: `${latFixed}° N`,
        gpsLongitude: `${lngFixed}° E`,
        mapSnapshotUrl: '',
        fileUrl: '',
        fileName: '',
        googleMapsUrl: `https://www.google.com/maps/search/?api=1&query=${latFixed},${lngFixed}`,
        capturedWithGps: true,
        collected: false,
      });
    }
  };

  // Explicit Save & Capture Satellite Screenshot of the specifically marked rooftop
  const handleSaveAndCaptureSnapshot = () => {
    const latFixed = Number(coords.lat).toFixed(6);
    const lngFixed = Number(coords.lng).toFixed(6);

    setSavingSnapshot(true);

    const staticUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${latFixed},${lngFixed}&zoom=19&size=640x360&scale=2&maptype=hybrid&markers=color:red%7Clabel:S%7C${latFixed},${lngFixed}&key=${GOOGLE_MAPS_KEY}`;
    const liveMapsUrl = `https://www.google.com/maps/search/?api=1&query=${latFixed},${lngFixed}`;

    setTimeout(() => {
      setSnapshotUrl(staticUrl);
      setIsLocationAllocated(true);
      setSavingSnapshot(false);

      if (onChange) {
        onChange({
          gpsLatitude: `${latFixed}° N`,
          gpsLongitude: `${lngFixed}° E`,
          mapSnapshotUrl: staticUrl,
          fileUrl: staticUrl,
          fileName: `rooftop_satellite_${latFixed}_${lngFixed}.jpg`,
          googleMapsUrl: liveMapsUrl,
          capturedWithGps: true,
          collected: true,
          allocatedAt: new Date().toISOString(),
        });
      }
    }, 350);
  };

  const handleDetectLocation = (mapInstance, markerInstance) => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const targetMap = mapInstance || mapInstanceRef.current;
        const targetMarker = markerInstance || markerRef.current;

        if (targetMap && targetMarker) {
          const newPos = new window.google.maps.LatLng(lat, lng);
          targetMap.setCenter(newPos);
          targetMap.setZoom(19);
          targetMarker.setPosition(newPos);
        }
        onPinPositionChange(lat, lng);
      },
      (err) => {
        setLocating(false);
        console.warn('Geolocation error:', err.message);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Upload real on-site camera photos (up to 5 photos)
  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    if (photos.length + files.length > 5) {
      alert('You can upload a maximum of 5 on-site camera photos.');
      return;
    }

    setUploadingPhoto(true);
    const newUploadedList = [...photos];

    for (const file of files) {
      try {
        let finalUrl = '';
        try {
          const res = await api.uploadFile(file, 'rooftop-site-photos');
          if (res && res.success && res.fileUrl) {
            finalUrl = res.fileUrl;
          }
        } catch (err) {
          console.warn('Backend upload fallback:', err);
        }

        if (!finalUrl) {
          finalUrl = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => resolve('');
            reader.readAsDataURL(file);
          });
        }

        if (finalUrl) {
          newUploadedList.push(finalUrl);
        }
      } catch (err) {
        console.error('Photo upload error:', err);
      }
    }

    setPhotos(newUploadedList);
    setUploadingPhoto(false);
    if (onPhotosChange) {
      onPhotosChange(newUploadedList);
    }
  };

  const handleRemovePhoto = (index) => {
    const updated = photos.filter((_, i) => i !== index);
    setPhotos(updated);
    if (onPhotosChange) {
      onPhotosChange(updated);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', width: '100%' }}>
      {/* 1. Interactive Satellite Map with Geolocation */}
      <div 
        style={{ 
          background: 'rgba(255, 255, 255, 0.03)', 
          border: '1px solid rgba(16, 185, 129, 0.3)', 
          borderRadius: '14px', 
          padding: '14px',
          boxSizing: 'border-box'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10b981', fontSize: '13px', fontWeight: 800 }}>
              <Navigation size={16} /> Live Google Satellite Rooftop Zoom
            </div>
            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
              Drag red pin or tap exactly on the terrace / chhat where solar panels will be installed.
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleDetectLocation()}
            disabled={locating}
            style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: '#fff',
              border: 'none',
              padding: '6px 14px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 10px rgba(16, 185, 129, 0.3)',
            }}
          >
            <Crosshair size={14} className={locating ? 'animate-spin' : ''} />
            {locating ? 'Locating...' : 'Auto Detect My GPS'}
          </button>
        </div>

        {/* Map Canvas */}
        <div 
          style={{ 
            position: 'relative', 
            width: '100%', 
            height: '280px', 
            borderRadius: '10px', 
            overflow: 'hidden',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            background: '#0a0f1d'
          }}
        >
          {loadingMap && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38bdf8', fontSize: '13px', background: '#0a0f1d', zIndex: 10 }}>
              Connecting to Google Maps Satellite...
            </div>
          )}
          {mapError && (
            <div style={{ position: 'absolute', inset: 0, padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#f87171', fontSize: '12px', textAlign: 'center', background: '#0a0f1d', zIndex: 10 }}>
              <div>⚠️ {mapError}</div>
              <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '6px' }}>Using GPS telemetry fallback.</div>
            </div>
          )}
          <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />
        </div>

        {/* Selected Coordinates & Open in Google Maps */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', marginTop: '12px', flexWrap: 'wrap' }}>
          <div style={{ background: 'rgba(0,0,0,0.35)', padding: '8px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>Marked Coordinates</div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#38bdf8', fontFamily: 'monospace', marginTop: '2px' }}>
              Lat: {coords.lat} | Lng: {coords.lng}
            </div>
          </div>

          <a
            href={`https://www.google.com/maps/search/?api=1&query=${coords.lat},${coords.lng}`}
            target="_blank"
            rel="noreferrer"
            style={{
              background: 'rgba(56, 189, 248, 0.15)',
              color: '#38bdf8',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              padding: '7px 14px',
              borderRadius: '8px',
              fontSize: '11px',
              fontWeight: 700,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <ExternalLink size={13} /> Open in Google Maps
          </a>
        </div>

        {/* Action Bar: Explicit Save & Screenshot Capture */}
        <div
          style={{
            marginTop: '12px',
            background: isLocationAllocated ? 'rgba(16, 185, 129, 0.08)' : 'rgba(245, 158, 11, 0.08)',
            border: `1px solid ${isLocationAllocated ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.35)'}`,
            borderRadius: '12px',
            padding: '12px 16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div style={{ flex: '1 1 240px' }}>
            <div style={{ fontSize: '13px', fontWeight: 800, color: isLocationAllocated ? '#34d399' : '#f59e0b', display: 'flex', alignItems: 'center', gap: '6px' }}>
              {isLocationAllocated ? <CheckCircle2 size={16} /> : <Crosshair size={16} />}
              {isLocationAllocated ? 'Rooftop Location Allocated & Screenshot Attached' : 'Location Not Allocated (Pending Save)'}
            </div>
            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '3px', lineHeight: 1.4 }}>
              {isLocationAllocated
                ? 'Terrace area marked and frozen. Snapshot is saved with this application.'
                : 'Map me pin ko building terrace par set karein, fir screenshot capture karne ke liye right side button dabayein.'}
            </div>
          </div>

          <button
            type="button"
            onClick={handleSaveAndCaptureSnapshot}
            disabled={savingSnapshot}
            style={{
              background: isLocationAllocated
                ? 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)'
                : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: '#fff',
              border: 'none',
              padding: '9px 18px',
              borderRadius: '9px',
              fontSize: '12px',
              fontWeight: 800,
              cursor: savingSnapshot ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '7px',
              boxShadow: isLocationAllocated ? '0 3px 12px rgba(2, 132, 199, 0.3)' : '0 3px 14px rgba(16, 185, 129, 0.45)',
              transition: 'all 0.2s ease',
            }}
          >
            <Camera size={15} />
            {savingSnapshot
              ? 'Capturing Snapshot...'
              : isLocationAllocated
              ? '🔄 Re-capture / Update Screenshot'
              : '📸 Save Marked Rooftop & Take Screenshot'}
          </button>
        </div>

        {/* Satellite Snapshot Thumbnail Preview - ONLY when allocated */}
        {isLocationAllocated && snapshotUrl ? (
          <div style={{ marginTop: '12px', background: 'rgba(0,0,0,0.4)', borderRadius: '10px', padding: '12px', border: '1px solid rgba(16,185,129,0.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#34d399', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <CheckCircle2 size={14} /> Confirmed Rooftop Satellite Area Screenshot (Attached to Survey)
              </span>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${coords.lat},${coords.lng}`}
                target="_blank"
                rel="noreferrer"
                style={{ fontSize: '11px', color: '#38bdf8', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}
              >
                <Eye size={12} /> Tap Image to Open Live Google Map
              </a>
            </div>
            <a href={`https://www.google.com/maps/search/?api=1&query=${coords.lat},${coords.lng}`} target="_blank" rel="noreferrer">
              <img
                src={snapshotUrl}
                alt="Rooftop Satellite Snapshot"
                style={{
                  width: '100%',
                  maxHeight: '200px',
                  objectFit: 'cover',
                  borderRadius: '6px',
                  border: '1px solid rgba(255,255,255,0.15)',
                  cursor: 'pointer',
                  display: 'block',
                }}
                title="Tap to open full Google Maps satellite location"
              />
            </a>
          </div>
        ) : (
          <div
            style={{
              marginTop: '12px',
              background: 'rgba(0, 0, 0, 0.25)',
              borderRadius: '10px',
              padding: '14px',
              border: '1px dashed rgba(255, 255, 255, 0.12)',
              textAlign: 'center',
              color: '#94a3b8',
              fontSize: '12px',
            }}
          >
            <div style={{ color: '#f59e0b', fontWeight: 700, fontSize: '12px', marginBottom: '3px' }}>
              ⏳ No Screenshot Attached Yet
            </div>
            <span>
              Pehle live map me zoom karke pin ko building terrace par locate karein, fir <strong>"Save Marked Rooftop & Take Screenshot"</strong> button dabayein. Tabhi screenshot add hoga.
            </span>
          </div>
        )}
      </div>

      {/* 2. Upload Up to 5 Real Camera On-Site Photos for High Trust */}
      <div 
        style={{ 
          background: 'rgba(255, 255, 255, 0.03)', 
          border: '1px solid rgba(255, 255, 255, 0.08)', 
          borderRadius: '14px', 
          padding: '14px',
          boxSizing: 'border-box'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#f59e0b', fontSize: '13px', fontWeight: 800 }}>
              <Camera size={16} /> Real Rooftop Camera Photos (Max 5 for Trust & Shadow Audit)
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
              Capture normal mobile camera photos of terrace, shadow obstacles, inverter location, and meter board.
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '11px', color: photos.length === 5 ? '#34d399' : '#94a3b8', fontWeight: 700 }}>
              {photos.length}/5 Photos Added
            </span>
            {photos.length < 5 && (
              <>
                <input
                  type="file"
                  id="site-camera-photos"
                  accept="image/*"
                  multiple
                  style={{ display: 'none' }}
                  onChange={handlePhotoUpload}
                  disabled={uploadingPhoto}
                />
                <label
                  htmlFor="site-camera-photos"
                  style={{
                    background: 'rgba(245, 158, 11, 0.15)',
                    color: '#f59e0b',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: uploadingPhoto ? 'not-allowed' : 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                  }}
                >
                  <Upload size={13} /> {uploadingPhoto ? 'Uploading...' : '+ Add Camera Photo'}
                </label>
              </>
            )}
          </div>
        </div>

        {/* Photos Grid Thumbnails */}
        {photos.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '10px', marginTop: '10px' }}>
            {photos.map((url, idx) => (
              <div 
                key={idx} 
                style={{ 
                  position: 'relative', 
                  borderRadius: '8px', 
                  overflow: 'hidden', 
                  border: '1px solid rgba(255,255,255,0.12)', 
                  aspectRatio: '1', 
                  background: '#0a0f1d' 
                }}
              >
                <img 
                  src={url} 
                  alt={`Site Photo ${idx + 1}`} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                />
                <div style={{ position: 'absolute', bottom: '4px', left: '4px', background: 'rgba(0,0,0,0.6)', padding: '2px 5px', borderRadius: '4px', fontSize: '9px', color: '#fff', fontWeight: 700 }}>
                  Photo {idx + 1}
                </div>
                <button
                  type="button"
                  onClick={() => handleRemovePhoto(idx)}
                  style={{
                    position: 'absolute',
                    top: '4px',
                    right: '4px',
                    background: 'rgba(239, 68, 68, 0.85)',
                    border: 'none',
                    color: '#fff',
                    borderRadius: '50%',
                    width: '20px',
                    height: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                  title="Remove this photo"
                >
                  <Trash2 size={11} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ padding: '16px', textAlign: 'center', color: '#64748b', fontSize: '11px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', border: '1px dashed rgba(255,255,255,0.06)' }}>
            No real camera photos added yet. Tap <strong>"+ Add Camera Photo"</strong> to attach site images for surveyor confidence.
          </div>
        )}
      </div>
    </div>
  );
}
