import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, MapPin, MessageSquare, AlertCircle, CheckCircle, Mic, MicOff } from 'lucide-react';
import { complaintService, handleApiError } from '../services/api';
import Loader from '../components/Loader';

const SubmitComplaint = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    latitude: '',
    longitude: '',
    address: '',
    complaint_text: '',
  });
  const [loading, setLoading] = useState({
    geolocation: false,
    submission: false,
    geocoding: false
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState(null);
  const [abortController, setAbortController] = useState(new AbortController());

  // Initialize speech recognition
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      
      if (SpeechRecognition) {
        try {
          const recognitionInstance = new SpeechRecognition();
          recognitionInstance.continuous = false; // Changed to false for better control
          recognitionInstance.interimResults = true;
          recognitionInstance.lang = 'en-US'; // Set language explicitly
          recognitionInstance.maxAlternatives = 1;
          
          recognitionInstance.onresult = (event) => {
            let finalTranscript = '';
            let interimTranscript = '';
            
            for (let i = event.resultIndex; i < event.results.length; i++) {
              const transcript = event.results[i][0].transcript;
              if (event.results[i].isFinal) {
                finalTranscript += transcript + ' ';
              } else {
                interimTranscript += transcript;
              }
            }
            
            if (finalTranscript) {
              setFormData(prev => ({
                ...prev,
                complaint_text: prev.complaint_text + finalTranscript
              }));
            }
          };

          recognitionInstance.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            setIsListening(false);
            
            const errorMessages = {
              'not-allowed': 'Microphone permission denied. Please allow microphone access.',
              'network': 'Network error. Please check your internet connection.',
              'no-speech': 'No speech detected. Please try again.',
              'audio-capture': 'No microphone found. Please connect a microphone.',
              'aborted': 'Speech recognition was aborted.',
              'service-not-allowed': 'Speech recognition service is not allowed.'
            };
            
            const errorMessage = errorMessages[event.error] || 'Error occurred in speech recognition';
            setError(errorMessage);
          };

          recognitionInstance.onend = () => {
            console.log('Speech recognition ended');
            setIsListening(false);
          };

          setRecognition(recognitionInstance);
          
          return () => {
            if (recognitionInstance) {
              recognitionInstance.stop();
              recognitionInstance.onresult = null;
              recognitionInstance.onerror = null;
              recognitionInstance.onend = null;
            }
          };
        } catch (error) {
          console.error('Error initializing speech recognition:', error);
          setError('Speech recognition initialization failed');
        }
      } else {
        console.log('Speech recognition not supported');
        setError('Speech recognition is not supported in your browser. Please use Chrome, Edge, or Safari.');
      }
    }
  }, []);

  // Check microphone permissions
  const checkMicrophonePermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (error) {
      console.error('Microphone permission error:', error);
      return false;
    }
  };

  const toggleListening = async () => {
    if (isListening) {
      if (recognition) {
        recognition.stop();
      }
      setIsListening(false);
      setSuccess('');
    } else {
      if (!recognition) {
        setError('Speech recognition not supported in your browser. Please use Chrome, Edge, or Safari.');
        return;
      }
      
      // Check microphone permissions first
      const hasPermission = await checkMicrophonePermission();
      if (!hasPermission) {
        setError('Microphone access denied. Please allow microphone access in your browser settings and try again.');
        return;
      }
      
      try {
        // Clear any previous error
        setError('');
        setSuccess('Listening... Speak clearly into your microphone');
        
        // Start recognition
        recognition.start();
        setIsListening(true);
        
        // Auto-stop after 30 seconds to prevent hanging
        setTimeout(() => {
          if (isListening) {
            recognition.stop();
            setIsListening(false);
            setSuccess('');
            setError('Recording stopped due to time limit. Click again to continue.');
          }
        }, 30000);
        
      } catch (err) {
        console.error('Error starting speech recognition:', err);
        setError('Failed to start voice input. Please check microphone permissions and try again.');
        setIsListening(false);
      }
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const getCurrentLocation = async () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    setLoading(prev => ({ ...prev, geolocation: true }));
    setError('');
    setSuccess('Getting your location...');

    try {
      // Cancel any previous geolocation request
      if (abortController) {
        abortController.abort();
      }
      const newAbortController = new AbortController();
      setAbortController(newAbortController);

      // Get current position with better error handling
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          (error) => {
            const errorMessages = {
              1: 'Please enable location permissions in your browser settings.',
              2: 'Unable to determine your location. Please try again or enter it manually.',
              3: 'Location request timed out. Please try again or enter it manually.'
            };
            reject(new Error(errorMessages[error.code] || 'Unable to retrieve your location.'));
          },
          {
            enableHighAccuracy: true,
            timeout: 10000, // 10 seconds
            maximumAge: 0, // Always get a fresh position
          }
        );
      });

      const { latitude, longitude } = position.coords;
      const cacheKey = `location_${latitude.toFixed(4)}_${longitude.toFixed(4)}`;
      
      // Update coordinates in form first
      setFormData(prev => ({
        ...prev,
        latitude: latitude.toString(),
        longitude: longitude.toString()
      }));

      // Try to get address from cache first
      const cachedAddress = localStorage.getItem(cacheKey);
      if (cachedAddress) {
        setFormData(prev => ({ 
          ...prev, 
          address: cachedAddress 
        }));
        setSuccess('Location and address loaded from cache');
        return;
      }

      setLoading(prev => ({ ...prev, geocoding: true }));
      setSuccess('Looking up address...');

      try {
        // Try multiple geocoding services in parallel
        const geocodePromises = [
          // OpenStreetMap Nominatim (no API key required, but has rate limits)
          fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1&zoom=18&namedetails=1`)
            .then(res => {
              if (!res.ok) throw new Error('Failed to fetch from Nominatim');
              return res.json();
            }),

          // LocationIQ (requires API key)
          import.meta.env.VITE_LOCATIONIQ_API_KEY && 
            fetch(`https://us1.locationiq.com/v1/reverse.php?key=${import.meta.env.VITE_LOCATIONIQ_API_KEY}&lat=${latitude}&lon=${longitude}&format=json&zoom=18&namedetails=1`)
              .then(res => {
                if (!res.ok) throw new Error('Failed to fetch from LocationIQ');
                return res.json();
              })
              .catch(() => null), // Silently fail if this service is not available
        ].filter(Boolean); // Remove any null/undefined promises

        // Wait for the first successful response
        const results = await Promise.any(geocodePromises);
        
        // Format the address based on the response
        let address;
        if (results.display_name) {
          // Use the full display name from the geocoding service
          address = results.display_name;
        } else if (results.address) {
          // Construct address from address components
          const addr = results.address;
          const addressParts = [
            addr.house_number && addr.road 
              ? `${addr.house_number} ${addr.road}` 
              : addr.road,
            addr.city_district || addr.town || addr.village || addr.hamlet,
            addr.state || addr.region,
            addr.country,
            addr.postcode
          ].filter(Boolean); // Remove any empty parts
          
          address = addressParts.join(', ');
        } else {
          // Fallback to coordinates if no address components found
          address = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
        }

        // Cache the address
        localStorage.setItem(cacheKey, address);
        
        // Update the form with the address
        setFormData(prev => ({
          ...prev,
          address
        }));
        
        setSuccess('Location and address captured successfully!');
      } catch (error) {
        console.error('Geocoding error:', error);
        // If geocoding fails, use coordinates as fallback
        const fallbackAddress = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
        setFormData(prev => ({
          ...prev,
          address: fallbackAddress
        }));
        setSuccess('Location captured! Please verify or complete the address.');
      }
    } catch (error) {
      console.error('Location error:', error);
      setError(error.message || 'Failed to get your location. Please enter it manually.');
    } finally {
      setLoading(prev => ({ ...prev, geolocation: false, geocoding: false }));
      // Clear success message after 5 seconds
      const timer = setTimeout(() => setSuccess(''), 5000);
      return () => clearTimeout(timer);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(prev => ({ ...prev, submission: true }));

    // Client-side validation
    const requiredFields = ['latitude', 'longitude', 'address', 'complaint_text'];
    const missingFields = requiredFields.filter(field => !formData[field]);
    
    if (missingFields.length > 0) {
      setError(`Please fill in all required fields: ${missingFields.join(', ')}`);
      setLoading(prev => ({ ...prev, submission: false }));
      return;
    }

    try {
      // Create a new complaint object
      const newComplaint = {
        id: Date.now(),
        status: 'pending',
        date: new Date().toISOString(),
        title: `Complaint #${Math.floor(1000 + Math.random() * 9000)}`,
        category: 'general',
        priority: 'medium',
        location: formData.address,
        description: formData.complaint_text,
        coordinates: {
          lat: parseFloat(formData.latitude),
          lng: parseFloat(formData.longitude)
        }
      };

      // Get existing complaints from local storage
      const existingComplaints = JSON.parse(localStorage.getItem('complaints') || '[]');
      console.log('Existing complaints:', existingComplaints.length);
      
      // Add the new complaint
      const updatedComplaints = [...existingComplaints, newComplaint];
      console.log('Updated complaints:', updatedComplaints.length);
      
      // Save back to local storage
      localStorage.setItem('complaints', JSON.stringify(updatedComplaints));
      console.log('Complaints saved to localStorage');
      
      // Verify it was saved
      const savedComplaints = JSON.parse(localStorage.getItem('complaints') || '[]');
      console.log('Verification - saved complaints:', savedComplaints.length);
      
      // Clear the form
      setFormData({
        latitude: '',
        longitude: '',
        address: '',
        complaint_text: '',
      });
      
      setSuccess('Complaint submitted successfully!');
      
      // Redirect to dashboard after 1.5 seconds
      setTimeout(() => {
        navigate('/dashboard', { 
          state: { 
            showSuccess: true,
            message: 'Complaint submitted successfully!',
            refreshComplaints: true
          },
          replace: true
        });
      }, 1500);
      
    } catch (error) {
      console.error('Error submitting complaint:', error);
      setError('Failed to submit complaint. Please try again.');
    } finally {
      setLoading(prev => ({ ...prev, submission: false }));
    }

    // This block has been moved to the getCurrentLocation function
  };

  if (loading.submission || loading.geolocation || loading.geocoding) {
    return <Loader />;
  }

  return (
    <div className="min-h-screen bg-slate-900 py-8">
      <div className="max-w-2xl mx-auto p-4">
        <div className="text-center mb-8">
          <Shield className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-white mb-2">Submit a Complaint</h1>
          <p className="text-gray-300 text-lg">Report issues in your city and help make it better</p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-900 border border-red-700 rounded-lg flex items-center">
            <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
            <span className="text-red-200">{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-900 border border-green-700 rounded-lg flex items-center">
            <CheckCircle className="h-5 w-5 text-green-400 mr-2" />
            <span className="text-green-200">{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-gray-800/60 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
          <div className="mb-6">
            <div className="flex justify-between items-center mb-1">
              <label htmlFor="location" className="block text-sm font-medium text-gray-200">
                Location <span className="text-red-400">*</span>
              </label>
              <button
                type="button"
                onClick={getCurrentLocation}
                className="text-sm text-green-400 hover:text-green-300 flex items-center"
                disabled={loading.geolocation || loading.geocoding}
              >
                <MapPin className="h-4 w-4 mr-1" />
                {loading.geolocation || loading.geocoding ? 'Getting location...' : 'Use my current location'}
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="latitude" className="block text-xs text-gray-400 mb-1">
                  Latitude
                </label>
                <input
                  type="text"
                  id="latitude"
                  name="latitude"
                  value={formData.latitude}
                  onChange={handleInputChange}
                  className="block w-full rounded-md bg-gray-700 border-gray-600 text-white placeholder-gray-400 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
                  placeholder="e.g., 28.6139"
                  required
                />
              </div>
              <div>
                <label htmlFor="longitude" className="block text-xs text-gray-400 mb-1">
                  Longitude
                </label>
                <input
                  type="text"
                  id="longitude"
                  name="longitude"
                  value={formData.longitude}
                  onChange={handleInputChange}
                  className="block w-full rounded-md bg-gray-700 border-gray-600 text-white placeholder-gray-400 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
                  placeholder="e.g., 77.2090"
                  required
                />
              </div>
            </div>
          </div>

          <div className="mb-6">
            <label htmlFor="address" className="block text-sm font-medium text-gray-200 mb-1">
              Address <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-start pt-3">
                <MapPin className="h-5 w-5 text-gray-400" />
              </div>
              <textarea
                id="address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                rows="2"
                className="pl-10 block w-full rounded-md bg-gray-700 border-gray-600 text-white placeholder-gray-400 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
                placeholder="Enter the full address of the location"
                required
              />
            </div>
          </div>

          <div className="mb-6">
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="complaint_text" className="block text-sm font-medium text-gray-200">
                Complaint Details <span className="text-red-400">*</span>
              </label>
              <button
                type="button"
                onClick={toggleListening}
                disabled={!recognition}
                className={`flex items-center text-sm px-3 py-1 rounded-md transition-all ${
                  !recognition 
                    ? 'text-gray-500 cursor-not-allowed' 
                    : isListening 
                    ? 'text-red-400 bg-red-900/30 hover:bg-red-900/50' 
                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50'
                }`}
                title={isListening ? 'Stop recording' : recognition ? 'Start voice input' : 'Voice input not available'}
              >
                {isListening ? (
                  <>
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse mr-2"></div>
                    <MicOff className="h-4 w-4 mr-1" />
                    <span>Stop</span>
                  </>
                ) : (
                  <>
                    <Mic className="h-4 w-4 mr-1" />
                    <span>{!recognition ? 'Unavailable' : 'Voice Input'}</span>
                  </>
                )}
              </button>
            </div>
            {isListening && (
              <div className="mb-2 text-sm text-amber-400 flex items-center">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse mr-2"></div>
                Listening... Speak now
              </div>
            )}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-start pt-3">
                <MessageSquare className="h-5 w-5 text-gray-400" />
              </div>
              <textarea
                id="complaint_text"
                name="complaint_text"
                value={formData.complaint_text}
                onChange={handleInputChange}
                rows="4"
                className="pl-10 block w-full rounded-md bg-gray-700 border-gray-600 text-white placeholder-gray-400 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
                placeholder="Describe your complaint in detail..."
                required
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading.submission || loading.geolocation || loading.geocoding}
              className={`w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
            >
              {loading.submission ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Submitting...
                </>
              ) : (
                'Submit Complaint'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SubmitComplaint;
