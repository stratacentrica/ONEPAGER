import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import { Card } from './components/ui/card';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Label } from './components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './components/ui/select';
import { Slider } from './components/ui/slider';
import { Switch } from './components/ui/switch';
import { Textarea } from './components/ui/textarea';
import { Separator } from './components/ui/separator';
import { 
  PlusCircle, 
  Type, 
  MousePointer, 
  FormInput, 
  Timer, 
  Music, 
  Video, 
  Image as ImageIcon,
  Download,
  Code,
  Upload,
  Palette,
  Move,
  Trash2,
  Play,
  Pause,
  Eye,
  Settings,
  Mail,
  Zap,
  MessageSquare,
  Bot,
  Sparkles,
  Phone,
  UserPlus,
  Bell,
  ListPlus,
  Camera,
  MapPin,
  Monitor,
  Gamepad2
} from 'lucide-react';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;

function App() {
  // State management
  const [currentPage, setCurrentPage] = useState(null);
  const [pages, setPages] = useState([]);
  const [selectedComponent, setSelectedComponent] = useState(null);
  const [draggedComponent, setDraggedComponent] = useState(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [backgroundImage, setBackgroundImage] = useState('');
  const [backgroundColor, setBackgroundColor] = useState('#0a0a0f');
  const [theme, setTheme] = useState('dark');
  const [royaltyFreeSounds, setRoyaltyFreeSounds] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [ftpDialogOpen, setFtpDialogOpen] = useState(false);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [ftpConfig, setFtpConfig] = useState({
    host: '',
    username: '',
    password: '',
    remote_path: '/'
  });
  const [emailConfig, setEmailConfig] = useState({
    to: '',
    subject: '',
    message: '',
    format: 'html'
  });
  const [viewCount, setViewCount] = useState(Math.floor(Math.random() * 1000) + 100);
  const [visitorData, setVisitorData] = useState({
    ip: '',
    location: '',
    device: '',
    browser: ''
  });
  
  // Background effects state
  const [backgroundEffects, setBackgroundEffects] = useState({
    fade: 100,
    blur: 0,
    invert: 0,
    vignette: 0
  });
  
  // Shimmer effect state
  const [shimmerEffect, setShimmerEffect] = useState({
    enabled: false,
    intensity: 50,
    frequency: 5000, // milliseconds
    color: '#ffffff'
  });
  
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  // Google Fonts list
  const googleFonts = [
    'Inter', 'Roboto', 'Open Sans', 'Lato', 'Montserrat', 
    'Source Sans Pro', 'Poppins', 'Oswald', 'Raleway', 'Ubuntu',
    'Nunito', 'Playfair Display', 'Merriweather', 'PT Sans', 'Crimson Text'
  ];

  // Free chatbot providers
  const chatbotProviders = [
    { id: 'elevenlabs', name: 'ElevenLabs AI', type: 'custom' },
    { id: 'tidio', name: 'Tidio Chat', type: 'free' },
    { id: 'crisp', name: 'Crisp Chat', type: 'free' },
    { id: 'tawk', name: 'Tawk.to', type: 'free' },
    { id: 'zendesk', name: 'Zendesk Chat', type: 'free' },
    { id: 'intercom', name: 'Intercom', type: 'free' }
  ];

  // CTA Button types
  const ctaButtonTypes = [
    { id: 'request-call', name: 'Request Call', icon: Phone, color: '#10B981' },
    { id: 'join-now', name: 'Join Now', icon: UserPlus, color: '#3B82F6' },
    { id: 'subscribe', name: 'Subscribe', icon: Bell, color: '#F59E0B' },
    { id: 'waitlist', name: 'Join Waitlist', icon: ListPlus, color: '#8B5CF6' },
    { id: 'email-me', name: 'Email Me', icon: Mail, color: '#EF4444' },
    { id: 'take-photo', name: 'Take Photo', icon: Camera, color: '#06B6D4' }
  ];

  // Slot machine prizes
  const slotPrizes = [
    { id: 'discount-10', name: '10% Discount', probability: 30, icon: '💰' },
    { id: 'discount-25', name: '25% Discount', probability: 15, icon: '🎯' },
    { id: 'free-trial', name: 'Free Trial', probability: 20, icon: '🚀' },
    { id: 'free-shipping', name: 'Free Shipping', probability: 25, icon: '📦' },
    { id: 'jackpot', name: 'JACKPOT!', probability: 5, icon: '🎉' },
    { id: 'try-again', name: 'Try Again', probability: 5, icon: '🎲' }
  ];

  // Component types available in the builder
  const componentTypes = [
    { id: 'text', name: 'Text', icon: Type, description: 'Add headings and paragraphs' },
    { id: 'button', name: 'Button', icon: MousePointer, description: 'Call-to-action buttons' },
    { id: 'cta-button', name: 'CTA Button', icon: Zap, description: 'Conversion buttons' },
    { id: 'form', name: 'Form', icon: FormInput, description: 'Data collection forms' },
    { id: 'timer', name: 'Timer', icon: Timer, description: 'Countdown timers' },
    { id: 'audio', name: 'Audio', icon: Music, description: 'Music and sound effects' },
    { id: 'video', name: 'Video', icon: Video, description: 'Video embeds' },
    { id: 'logo', name: 'Logo', icon: ImageIcon, description: 'Brand logos and images' },
    { id: 'chatbot', name: 'AI Chat', icon: MessageSquare, description: 'ElevenLabs AI Bot' },
    { id: 'livechat', name: 'Live Chat', icon: Bot, description: 'Free Chat Providers' },
    { id: 'slot-machine', name: 'Slot Game', icon: Gamepad2, description: 'Gamification Widget' },
    { id: 'visitor-data', name: 'Visitor Info', icon: Monitor, description: 'Show visitor data' },
  ];

  // Load Google Fonts
  useEffect(() => {
    const loadGoogleFonts = () => {
      googleFonts.forEach(font => {
        const link = document.createElement('link');
        link.href = `https://fonts.googleapis.com/css2?family=${font.replace(' ', '+')}:wght@300;400;500;600;700&display=swap`;
        link.rel = 'stylesheet';
        document.head.appendChild(link);
      });
    };
    loadGoogleFonts();
  }, []);

  // Load initial data and visitor info
  useEffect(() => {
    fetchPages();
    fetchRoyaltyFreeSounds();
    fetchVisitorData();
    
    // Simulate view count changes
    const interval = setInterval(() => {
      setViewCount(prev => prev + Math.floor(Math.random() * 3));
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  // Fetch visitor data (IP, location, device)
  const fetchVisitorData = async () => {
    try {
      // Get IP and location
      const ipResponse = await fetch('https://api.ipify.org?format=json');
      const ipData = await ipResponse.json();
      
      const locationResponse = await fetch(`https://ipapi.co/${ipData.ip}/json/`);
      const locationData = await locationResponse.json();
      
      // Get device info
      const deviceInfo = {
        browser: navigator.userAgent.split(' ').pop(),
        device: /Mobile|Android|iPhone|iPad/.test(navigator.userAgent) ? 'Mobile' : 'Desktop',
        os: navigator.platform
      };
      
      setVisitorData({
        ip: ipData.ip,
        location: `${locationData.city}, ${locationData.country_name}`,
        device: `${deviceInfo.device} (${deviceInfo.os})`,
        browser: deviceInfo.browser
      });
    } catch (error) {
      console.error('Error fetching visitor data:', error);
      setVisitorData({
        ip: '192.168.1.1',
        location: 'Anonymous Location',
        device: 'Unknown Device',
        browser: 'Unknown Browser'
      });
    }
  };

  // Shimmer effect
  useEffect(() => {
    if (!shimmerEffect.enabled) return;
    
    const interval = setInterval(() => {
      const shimmerElement = document.querySelector('.shimmer-overlay');
      if (shimmerElement) {
        shimmerElement.classList.add('shimmer-active');
        setTimeout(() => {
          shimmerElement.classList.remove('shimmer-active');
        }, 2000);
      }
    }, shimmerEffect.frequency);
    
    return () => clearInterval(interval);
  }, [shimmerEffect]);

  const fetchPages = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/pages`);
      setPages(response.data);
    } catch (error) {
      console.error('Error fetching pages:', error);
    }
  };

  const fetchRoyaltyFreeSounds = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/royalty-free-sounds`);
      setRoyaltyFreeSounds(response.data.sounds);
    } catch (error) {
      console.error('Error fetching sounds:', error);
    }
  };

  const createNewPage = async () => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/pages`, {
        title: `APEXONE Page ${pages.length + 1}`,
        background_color: backgroundColor,
        theme: theme
      });
      setCurrentPage(response.data);
      setPages([...pages, response.data]);
    } catch (error) {
      console.error('Error creating page:', error);
    }
  };

  const updatePage = async (pageData) => {
    if (!currentPage) return;
    
    try {
      const response = await axios.put(`${API_BASE_URL}/api/pages/${currentPage.id}`, pageData);
      setCurrentPage(response.data);
      setPages(pages.map(p => p.id === currentPage.id ? response.data : p));
    } catch (error) {
      console.error('Error updating page:', error);
    }
  };

  const addComponent = (type) => {
    if (!currentPage) return;

    const newComponent = {
      id: `${type}-${Date.now()}`,
      type: type,
      content: getDefaultContent(type),
      position: { x: 100, y: 100 },
      style: getDefaultStyle(type)
    };

    const updatedComponents = [...(currentPage.components || []), newComponent];
    updatePage({ components: updatedComponents });
  };

  const getDefaultContent = (type) => {
    switch (type) {
      case 'text':
        return { text: 'Your text here', tag: 'p', fontFamily: 'Inter', allCaps: false };
      case 'button':
        return { text: 'Click Me', action: 'alert("Button clicked!")', fontFamily: 'Inter', allCaps: false };
      case 'cta-button':
        return { 
          ctaType: 'request-call', 
          text: 'Request Call', 
          action: 'call',
          phone: '+1-555-0123',
          email: 'contact@example.com',
          formFields: ['name', 'email', 'phone'],
          fontFamily: 'Inter', 
          allCaps: false 
        };
      case 'form':
        return { fields: [{ name: 'email', type: 'email', placeholder: 'Enter your email' }] };
      case 'timer':
        return { endDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() };
      case 'audio':
        return { url: '', autoplay: false, loop: false };
      case 'video':
        return { url: '', autoplay: false };
      case 'logo':
        return { url: '', alt: 'Logo' };
      case 'chatbot':
        return { 
          botId: '', 
          placeholder: 'Ask me anything...',
          greeting: 'Hello! How can I help you today?'
        };
      case 'livechat':
        return {
          provider: 'tidio',
          widgetId: '',
          customization: {
            theme: 'dark',
            position: 'bottom-right'
          }
        };
      case 'slot-machine':
        return {
          winEvery: 5, // Win every 5th play
          currentPlays: 0,
          prizes: slotPrizes,
          title: '🎰 Spin to Win!',
          subtitle: 'Try your luck!'
        };
      case 'visitor-data':
        return {
          showIP: true,
          showLocation: true,
          showDevice: true,
          showBrowser: true,
          title: '🔒 Your Security Info',
          style: 'security'
        };
      default:
        return {};
    }
  };

  const getDefaultStyle = (type) => {
    const baseStyle = {
      color: theme === 'dark' ? '#ffffff' : '#000000',
      background: 'rgba(192, 192, 192, 0.1)', // Changed to silverish
      borderRadius: '12px',
      backdropFilter: 'blur(12px)',
      border: '1px solid rgba(192, 192, 192, 0.2)' // Changed to silverish
    };

    switch (type) {
      case 'text':
        return { ...baseStyle, fontSize: 16, fontWeight: 'normal', fontFamily: 'Inter' };
      case 'button':
      case 'cta-button':
        return { 
          ...baseStyle, 
          padding: '12px 24px', 
          fontSize: 14, 
          fontWeight: 'medium',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          fontFamily: 'Inter'
        };
      case 'slot-machine':
        return {
          ...baseStyle,
          width: '320px',
          height: '400px',
          padding: '16px',
          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.9) 0%, rgba(96, 165, 250, 0.9) 100%)'
        };
      case 'visitor-data':
        return {
          ...baseStyle,
          width: '300px',
          height: '280px',
          padding: '16px',
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)'
        };
      case 'chatbot':
        return {
          ...baseStyle,
          width: '300px',
          height: '400px',
          padding: '16px'
        };
      case 'livechat':
        return {
          ...baseStyle,
          width: '280px',
          height: '350px',
          padding: '16px'
        };
      default:
        return baseStyle;
    }
  };

  // Handle camera capture
  const handleCameraCapture = async (componentId) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      const video = document.createElement('video');
      video.srcObject = stream;
      video.play();
      
      video.addEventListener('loadedmetadata', () => {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0);
        
        const imageData = canvas.toDataURL('image/jpeg');
        stream.getTracks().forEach(track => track.stop());
        
        // Save the captured image
        updateComponent(componentId, {
          content: { ...selectedComponent.content, capturedImage: imageData }
        });
        
        alert('📸 Photo captured successfully!');
      });
      
    } catch (error) {
      console.error('Camera access denied:', error);
      alert('❌ Camera access denied. Please allow camera permissions.');
    }
  };

  // Handle slot machine spin
  const handleSlotSpin = (componentId) => {
    const component = currentPage.components.find(c => c.id === componentId);
    const currentPlays = component.content.currentPlays + 1;
    const winEvery = component.content.winEvery;
    
    let prize;
    if (currentPlays % winEvery === 0) {
      // Guaranteed win - select from winning prizes
      const winningPrizes = slotPrizes.filter(p => p.id !== 'try-again');
      prize = winningPrizes[Math.floor(Math.random() * winningPrizes.length)];
    } else {
      // Random based on probability
      const rand = Math.random() * 100;
      let cumulative = 0;
      for (const p of slotPrizes) {
        cumulative += p.probability;
        if (rand <= cumulative) {
          prize = p;
          break;
        }
      }
    }
    
    updateComponent(componentId, {
      content: { 
        ...component.content, 
        currentPlays,
        lastPrize: prize
      }
    });
    
    setTimeout(() => {
      alert(`${prize.icon} ${prize.name}! ${prize.id === 'jackpot' ? 'CONGRATULATIONS!' : 'Claim your prize!'}`);
    }, 2000);
  };

  const updateComponent = (componentId, updates) => {
    if (!currentPage) return;

    const updatedComponents = currentPage.components.map(comp =>
      comp.id === componentId ? { ...comp, ...updates } : comp
    );
    updatePage({ components: updatedComponents });
  };

  const handleComponentDrag = (componentId, e) => {
    if (!currentPage) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const updatedComponents = currentPage.components.map(comp =>
      comp.id === componentId ? { ...comp, position: { x: x - 50, y: y - 25 } } : comp
    );
    updatePage({ components: updatedComponents });
  };

  const handleComponentClick = (component, e) => {
    e.stopPropagation();
    setSelectedComponent(component);
  };

  const handleCanvasDrop = (e) => {
    e.preventDefault();
    if (!draggedComponent || !currentPage) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    addComponentAtPosition(draggedComponent, x, y);
    setDraggedComponent(null);
  };

  const addComponentAtPosition = (type, x, y) => {
    const newComponent = {
      id: `${type}-${Date.now()}`,
      type: type,
      content: getDefaultContent(type),
      position: { x: x - 50, y: y - 25 },
      style: getDefaultStyle(type)
    };

    const updatedComponents = [...(currentPage.components || []), newComponent];
    updatePage({ components: updatedComponents });
  };

  const deleteComponent = (componentId) => {
    if (!currentPage) return;

    const updatedComponents = currentPage.components.filter(comp => comp.id !== componentId);
    updatePage({ components: updatedComponents });
    setSelectedComponent(null);
  };

  const handleBackgroundImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      setIsLoading(true);
      const response = await axios.post(`${API_BASE_URL}/api/upload/image`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setBackgroundImage(response.data.url);
      updatePage({ background_image: response.data.url });
    } catch (error) {
      console.error('Error uploading image:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const exportPage = async (format = 'html') => {
    if (!currentPage) return;

    try {
      setIsLoading(true);
      const response = await axios.post(`${API_BASE_URL}/api/pages/${currentPage.id}/export`, {
        page_id: currentPage.id,
        format: format
      }, {
        responseType: format === 'json' ? 'json' : 'blob'
      });
      
      if (format === 'json') {
        // For JSON, create a downloadable file
        const jsonStr = JSON.stringify(response.data, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${currentPage.title.replace(' ', '_')}.json`);
        document.body.appendChild(link);
        link.click();
        link.remove();
      } else {
        // For HTML and iframe formats
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        const extension = format === 'iframe' ? '_embed.html' : '.html';
        link.setAttribute('download', `${currentPage.title.replace(' ', '_')}${extension}`);
        document.body.appendChild(link);
        link.click();
        link.remove();
      }
      
      alert(`✅ ${format.toUpperCase()} export completed successfully!`);
    } catch (error) {
      console.error('Error exporting page:', error);
      alert(`❌ Export failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const getEmbedCode = async (format = 'iframe') => {
    if (!currentPage) return;

    try {
      const response = await axios.post(`${API_BASE_URL}/api/pages/${currentPage.id}/embed-code?format=${format}`);
      navigator.clipboard.writeText(response.data.embed_code);
      alert(`📋 ${format.toUpperCase()} embed code copied to clipboard!`);
    } catch (error) {
      console.error('Error getting embed code:', error);
      alert('❌ Failed to copy embed code');
    }
  };

  const uploadViaFTP = async () => {
    if (!currentPage) return;

    try {
      setIsLoading(true);
      const response = await axios.post(`${API_BASE_URL}/api/pages/${currentPage.id}/ftp-upload`, {
        page_id: currentPage.id,
        ftp_host: ftpConfig.host,
        ftp_username: ftpConfig.username,
        ftp_password: ftpConfig.password,
        remote_path: ftpConfig.remote_path
      });
      
      alert(`🚀 Success! ${response.data.message}`);
      setFtpDialogOpen(false);
    } catch (error) {
      console.error('FTP upload error:', error);
      alert(`❌ FTP Upload failed: ${error.response?.data?.detail || error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const sendEmail = async () => {
    if (!currentPage) return;

    try {
      setIsLoading(true);
      const response = await axios.post(`${API_BASE_URL}/api/pages/${currentPage.id}/email`, {
        page_id: currentPage.id,
        to_email: emailConfig.to,
        subject: emailConfig.subject,
        message: emailConfig.message,
        format: emailConfig.format || 'html'
      });
      
      alert(`📧 Success! ${response.data.message}`);
      setEmailDialogOpen(false);
    } catch (error) {
      console.error('Email send error:', error);
      alert(`❌ Email failed: ${error.response?.data?.detail || error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const renderComponent = (component) => {
    const { type, content, position, style } = component;
    const fontStyle = {
      fontFamily: content.fontFamily || 'Inter',
      textTransform: content.allCaps ? 'uppercase' : 'none'
    };
    
    const commonStyle = {
      position: 'absolute',
      left: `${position.x}px`,
      top: `${position.y}px`,
      cursor: 'move',
      ...style,
      ...fontStyle
    };

    switch (type) {
      case 'text':
        const Tag = content.tag || 'p';
        return (
          <Tag
            key={component.id}
            style={commonStyle}
            onClick={(e) => handleComponentClick(component, e)}
            className={`component glass-effect ${selectedComponent?.id === component.id ? 'selected' : ''}`}
          >
            {content.text || 'Your text here'}
          </Tag>
        );

      case 'button':
        return (
          <button
            key={component.id}
            style={commonStyle}
            onClick={(e) => handleComponentClick(component, e)}
            className={`component glass-button ${selectedComponent?.id === component.id ? 'selected' : ''}`}
          >
            {content.text || 'Button'}
          </button>
        );

      case 'cta-button':
        const ctaType = ctaButtonTypes.find(c => c.id === content.ctaType) || ctaButtonTypes[0];
        const ctaStyle = { ...commonStyle, background: `${ctaType.color}15`, border: `1px solid ${ctaType.color}30` };
        return (
          <button
            key={component.id}
            style={ctaStyle}
            onClick={(e) => {
              handleComponentClick(component, e);
              if (content.ctaType === 'take-photo') {
                handleCameraCapture(component.id);
              }
            }}
            className={`component cta-button ${selectedComponent?.id === component.id ? 'selected' : ''}`}
          >
            <ctaType.icon size={16} style={{ marginRight: '8px', color: ctaType.color }} />
            {content.text || ctaType.name}
          </button>
        );

      case 'slot-machine':
        return (
          <div
            key={component.id}
            style={commonStyle}
            onClick={(e) => handleComponentClick(component, e)}
            className={`component slot-machine ${selectedComponent?.id === component.id ? 'selected' : ''}`}
          >
            <div className="slot-header">
              <h3>{content.title}</h3>
              <p>{content.subtitle}</p>
            </div>
            <div className="slot-reels">
              <div className="reel">🍒</div>
              <div className="reel">🍋</div>
              <div className="reel">🔔</div>
            </div>
            <div className="slot-info">
              <p>Plays: {content.currentPlays}</p>
              {content.lastPrize && <p>Last: {content.lastPrize.icon} {content.lastPrize.name}</p>}
            </div>
            <button 
              className="spin-button"
              onClick={(e) => {
                e.stopPropagation();
                handleSlotSpin(component.id);
              }}
            >
              🎰 SPIN
            </button>
          </div>
        );

      case 'visitor-data':
        return (
          <div
            key={component.id}
            style={commonStyle}
            onClick={(e) => handleComponentClick(component, e)}
            className={`component visitor-data ${selectedComponent?.id === component.id ? 'selected' : ''}`}
          >
            <div className="data-header">
              <h3>{content.title}</h3>
            </div>
            <div className="data-fields">
              {content.showIP && <div className="data-field">🌐 IP: {visitorData.ip}</div>}
              {content.showLocation && <div className="data-field">📍 Location: {visitorData.location}</div>}
              {content.showDevice && <div className="data-field">💻 Device: {visitorData.device}</div>}
              {content.showBrowser && <div className="data-field">🌏 Browser: {visitorData.browser}</div>}
            </div>
            <div className="security-badge">
              <span>🔒 Secure Connection</span>
            </div>
          </div>
        );

      case 'timer':
        return (
          <div
            key={component.id}
            style={commonStyle}
            onClick={(e) => handleComponentClick(component, e)}
            className={`component glass-effect ${selectedComponent?.id === component.id ? 'selected' : ''}`}
          >
            <div className="timer-display">
              <div className="timer-value">00:00:00</div>
              <div className="timer-label">Time Remaining</div>
            </div>
          </div>
        );

      case 'audio':
        return (
          <div
            key={component.id}
            style={commonStyle}
            onClick={(e) => handleComponentClick(component, e)}
            className={`component glass-effect ${selectedComponent?.id === component.id ? 'selected' : ''}`}
          >
            <div className="audio-player">
              <Play size={16} />
              <span>Audio Player</span>
            </div>
          </div>
        );

      case 'chatbot':
        return (
          <div
            key={component.id}
            style={commonStyle}
            onClick={(e) => handleComponentClick(component, e)}
            className={`component glass-effect chatbot-widget ${selectedComponent?.id === component.id ? 'selected' : ''}`}
          >
            <div className="chatbot-header">
              <MessageSquare size={16} />
              <span>ElevenLabs AI</span>
            </div>
            <div className="chatbot-content">
              <p>{content.greeting}</p>
              <div className="chat-input">
                <input placeholder={content.placeholder} disabled />
                <button><Zap size={14} /></button>
              </div>
            </div>
          </div>
        );

      case 'livechat':
        const provider = chatbotProviders.find(p => p.id === content.provider) || chatbotProviders[1];
        return (
          <div
            key={component.id}
            style={commonStyle}
            onClick={(e) => handleComponentClick(component, e)}
            className={`component glass-effect livechat-widget ${selectedComponent?.id === component.id ? 'selected' : ''}`}
          >
            <div className="livechat-header">
              <Bot size={16} />
              <span>{provider.name}</span>
            </div>
            <div className="livechat-content">
              <div className="chat-preview">
                <div className="chat-bubble">
                  Hi! How can we help you today?
                </div>
              </div>
              <div className="chat-input">
                <input placeholder="Type your message..." disabled />
                <button>Send</button>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div
            key={component.id}
            style={commonStyle}
            onClick={(e) => handleComponentClick(component, e)}
            className={`component glass-effect ${selectedComponent?.id === component.id ? 'selected' : ''}`}
          >
            {type} Component
          </div>
        );
    }
  };

  const ComponentPropertiesPanel = () => {
    if (!selectedComponent) return null;

    return (
      <div className="properties-panel">
        <div className="panel-header">
          <h3>Component Properties</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => deleteComponent(selectedComponent.id)}
            className="text-red-400 hover:text-red-300"
          >
            <Trash2 size={16} />
          </Button>
        </div>

        <div className="properties-content">
          {selectedComponent.type === 'cta-button' && (
            <>
              <div className="property-group">
                <Label>CTA Type</Label>
                <Select
                  value={selectedComponent.content.ctaType || 'request-call'}
                  onValueChange={(value) => {
                    const ctaType = ctaButtonTypes.find(c => c.id === value);
                    updateComponent(selectedComponent.id, {
                      content: { 
                        ...selectedComponent.content, 
                        ctaType: value,
                        text: ctaType.name 
                      }
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ctaButtonTypes.map(cta => (
                      <SelectItem key={cta.id} value={cta.id}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <cta.icon size={16} style={{ color: cta.color }} />
                          {cta.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="property-group">
                <Label>Button Text</Label>
                <Input
                  value={selectedComponent.content.text || ''}
                  onChange={(e) => updateComponent(selectedComponent.id, {
                    content: { ...selectedComponent.content, text: e.target.value }
                  })}
                  placeholder="Button text..."
                />
              </div>

              {(selectedComponent.content.ctaType === 'request-call') && (
                <div className="property-group">
                  <Label>Phone Number</Label>
                  <Input
                    value={selectedComponent.content.phone || ''}
                    onChange={(e) => updateComponent(selectedComponent.id, {
                      content: { ...selectedComponent.content, phone: e.target.value }
                    })}
                    placeholder="+1-555-0123"
                  />
                </div>
              )}

              {(selectedComponent.content.ctaType === 'email-me') && (
                <div className="property-group">
                  <Label>Email Address</Label>
                  <Input
                    value={selectedComponent.content.email || ''}
                    onChange={(e) => updateComponent(selectedComponent.id, {
                      content: { ...selectedComponent.content, email: e.target.value }
                    })}
                    placeholder="contact@example.com"
                  />
                </div>
              )}
            </>
          )}

          {selectedComponent.type === 'slot-machine' && (
            <>
              <div className="property-group">
                <Label>Title</Label>
                <Input
                  value={selectedComponent.content.title || ''}
                  onChange={(e) => updateComponent(selectedComponent.id, {
                    content: { ...selectedComponent.content, title: e.target.value }
                  })}
                  placeholder="🎰 Spin to Win!"
                />
              </div>
              
              <div className="property-group">
                <Label>Win Every X Plays</Label>
                <Slider
                  value={[selectedComponent.content.winEvery || 5]}
                  onValueChange={(value) => updateComponent(selectedComponent.id, {
                    content: { ...selectedComponent.content, winEvery: value[0] }
                  })}
                  min={2}
                  max={20}
                  step={1}
                />
                <span className="text-sm text-gray-400">Currently: Every {selectedComponent.content.winEvery || 5} plays</span>
              </div>

              <div className="property-group">
                <Label>Statistics</Label>
                <div className="slot-stats">
                  <p>Total Plays: {selectedComponent.content.currentPlays || 0}</p>
                  {selectedComponent.content.lastPrize && (
                    <p>Last Prize: {selectedComponent.content.lastPrize.icon} {selectedComponent.content.lastPrize.name}</p>
                  )}
                </div>
              </div>
            </>
          )}

          {selectedComponent.type === 'visitor-data' && (
            <>
              <div className="property-group">
                <Label>Title</Label>
                <Input
                  value={selectedComponent.content.title || ''}
                  onChange={(e) => updateComponent(selectedComponent.id, {
                    content: { ...selectedComponent.content, title: e.target.value }
                  })}
                  placeholder="🔒 Your Security Info"
                />
              </div>
              
              <div className="property-group">
                <Label>Data to Show</Label>
                <div className="data-toggles">
                  <div className="toggle-item">
                    <Label>Show IP Address</Label>
                    <Switch
                      checked={selectedComponent.content.showIP !== false}
                      onCheckedChange={(checked) => updateComponent(selectedComponent.id, {
                        content: { ...selectedComponent.content, showIP: checked }
                      })}
                    />
                  </div>
                  <div className="toggle-item">
                    <Label>Show Location</Label>
                    <Switch
                      checked={selectedComponent.content.showLocation !== false}
                      onCheckedChange={(checked) => updateComponent(selectedComponent.id, {
                        content: { ...selectedComponent.content, showLocation: checked }
                      })}
                    />
                  </div>
                  <div className="toggle-item">
                    <Label>Show Device</Label>
                    <Switch
                      checked={selectedComponent.content.showDevice !== false}
                      onCheckedChange={(checked) => updateComponent(selectedComponent.id, {
                        content: { ...selectedComponent.content, showDevice: checked }
                      })}
                    />
                  </div>
                  <div className="toggle-item">
                    <Label>Show Browser</Label>
                    <Switch
                      checked={selectedComponent.content.showBrowser !== false}
                      onCheckedChange={(checked) => updateComponent(selectedComponent.id, {
                        content: { ...selectedComponent.content, showBrowser: checked }
                      })}
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          {(selectedComponent.type === 'text' || selectedComponent.type === 'button') && (
            <>
              <div className="property-group">
                <Label>{selectedComponent.type === 'text' ? 'Text Content' : 'Button Text'}</Label>
                {selectedComponent.type === 'text' ? (
                  <Textarea
                    value={selectedComponent.content.text || ''}
                    onChange={(e) => updateComponent(selectedComponent.id, {
                      content: { ...selectedComponent.content, text: e.target.value }
                    })}
                    placeholder="Enter your text..."
                  />
                ) : (
                  <Input
                    value={selectedComponent.content.text || ''}
                    onChange={(e) => updateComponent(selectedComponent.id, {
                      content: { ...selectedComponent.content, text: e.target.value }
                    })}
                    placeholder="Button text..."
                  />
                )}
              </div>
              
              <div className="property-group">
                <Label>Font Family</Label>
                <Select
                  value={selectedComponent.content.fontFamily || 'Inter'}
                  onValueChange={(value) => updateComponent(selectedComponent.id, {
                    content: { ...selectedComponent.content, fontFamily: value },
                    style: { ...selectedComponent.style, fontFamily: value }
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {googleFonts.map(font => (
                      <SelectItem key={font} value={font}>{font}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="property-group">
                <div className="all-caps-toggle">
                  <Label>ALL CAPS</Label>
                  <Switch
                    checked={selectedComponent.content.allCaps || false}
                    onCheckedChange={(checked) => updateComponent(selectedComponent.id, {
                      content: { ...selectedComponent.content, allCaps: checked }
                    })}
                  />
                </div>
              </div>

              {selectedComponent.type === 'text' && (
                <>
                  <div className="property-group">
                    <Label>Tag</Label>
                    <Select
                      value={selectedComponent.content.tag || 'p'}
                      onValueChange={(value) => updateComponent(selectedComponent.id, {
                        content: { ...selectedComponent.content, tag: value }
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="h1">Heading 1</SelectItem>
                        <SelectItem value="h2">Heading 2</SelectItem>
                        <SelectItem value="h3">Heading 3</SelectItem>
                        <SelectItem value="p">Paragraph</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="property-group">
                    <Label>Font Size</Label>
                    <Slider
                      value={[selectedComponent.style.fontSize || 16]}
                      onValueChange={(value) => updateComponent(selectedComponent.id, {
                        style: { ...selectedComponent.style, fontSize: value[0] }
                      })}
                      min={12}
                      max={72}
                      step={1}
                    />
                  </div>
                </>
              )}

              {selectedComponent.type === 'button' && (
                <div className="property-group">
                  <Label>Action (JavaScript)</Label>
                  <Textarea
                    value={selectedComponent.content.action || ''}
                    onChange={(e) => updateComponent(selectedComponent.id, {
                      content: { ...selectedComponent.content, action: e.target.value }
                    })}
                    placeholder="alert('Hello!');"
                  />
                </div>
              )}
            </>
          )}

          {selectedComponent.type === 'chatbot' && (
            <>
              <div className="property-group">
                <Label>Bot ID (ElevenLabs)</Label>
                <Input
                  value={selectedComponent.content.botId || ''}
                  onChange={(e) => updateComponent(selectedComponent.id, {
                    content: { ...selectedComponent.content, botId: e.target.value }
                  })}
                  placeholder="your-elevenlabs-bot-id"
                />
              </div>
              <div className="property-group">
                <Label>Greeting Message</Label>
                <Textarea
                  value={selectedComponent.content.greeting || ''}
                  onChange={(e) => updateComponent(selectedComponent.id, {
                    content: { ...selectedComponent.content, greeting: e.target.value }
                  })}
                  placeholder="Hello! How can I help you today?"
                />
              </div>
              <div className="property-group">
                <Label>Input Placeholder</Label>
                <Input
                  value={selectedComponent.content.placeholder || ''}
                  onChange={(e) => updateComponent(selectedComponent.id, {
                    content: { ...selectedComponent.content, placeholder: e.target.value }
                  })}
                  placeholder="Ask me anything..."
                />
              </div>
            </>
          )}

          {selectedComponent.type === 'audio' && (
            <>
              <div className="property-group">
                <Label>Audio Source</Label>
                <Tabs defaultValue="library" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="library">🎵 Free Library</TabsTrigger>
                    <TabsTrigger value="upload">📁 Upload</TabsTrigger>
                  </TabsList>
                  <TabsContent value="library" className="mt-4">
                    <div className="music-library">
                      <Label>Chill & Atmospheric Tracks</Label>
                      <div className="music-tracks">
                        {royaltyFreeSounds.map((sound) => (
                          <div key={sound.id} className="music-track glass-effect p-2 mb-2 cursor-pointer"
                               onClick={() => updateComponent(selectedComponent.id, {
                                 content: { ...selectedComponent.content, url: sound.url, name: sound.name }
                               })}>
                            <div className="track-info">
                              <span className="track-name">{sound.name}</span>
                              <span className="track-details">
                                {sound.genre} • {sound.duration} • {sound.mood}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </TabsContent>
                  <TabsContent value="upload" className="mt-4">
                    <div className="audio-upload">
                      <Button
                        onClick={() => {/* TODO: Implement audio upload */}}
                        variant="outline"
                        className="w-full glass-button"
                      >
                        <Upload size={16} className="mr-2" />
                        Upload Audio File
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
              <div className="property-group">
                <Label>Current Track</Label>
                <Input
                  value={selectedComponent.content.name || 'No track selected'}
                  readOnly
                  className="glass-effect"
                />
              </div>
              <div className="property-group">
                <div className="audio-controls">
                  <Label>Autoplay</Label>
                  <Switch
                    checked={selectedComponent.content.autoplay || false}
                    onCheckedChange={(checked) => updateComponent(selectedComponent.id, {
                      content: { ...selectedComponent.content, autoplay: checked }
                    })}
                  />
                </div>
              </div>
              <div className="property-group">
                <div className="audio-controls">
                  <Label>Loop</Label>
                  <Switch
                    checked={selectedComponent.content.loop || false}
                    onCheckedChange={(checked) => updateComponent(selectedComponent.id, {
                      content: { ...selectedComponent.content, loop: checked }
                    })}
                  />
                </div>
              </div>
            </>
          )}

          {selectedComponent.type === 'livechat' && (
            <>
              <div className="property-group">
                <Label>Chat Provider</Label>
                <Select
                  value={selectedComponent.content.provider || 'tidio'}
                  onValueChange={(value) => updateComponent(selectedComponent.id, {
                    content: { ...selectedComponent.content, provider: value }
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {chatbotProviders.map(provider => (
                      <SelectItem key={provider.id} value={provider.id}>
                        {provider.name} ({provider.type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="property-group">
                <Label>Widget ID</Label>
                <Input
                  value={selectedComponent.content.widgetId || ''}
                  onChange={(e) => updateComponent(selectedComponent.id, {
                    content: { ...selectedComponent.content, widgetId: e.target.value }
                  })}
                  placeholder="your-widget-id"
                />
              </div>
            </>
          )}

          <div className="property-group">
            <Label>Position</Label>
            <div className="position-inputs">
              <Input
                type="number"
                value={selectedComponent.position.x}
                onChange={(e) => updateComponent(selectedComponent.id, {
                  position: { ...selectedComponent.position, x: parseInt(e.target.value) || 0 }
                })}
                placeholder="X"
              />
              <Input
                type="number"
                value={selectedComponent.position.y}
                onChange={(e) => updateComponent(selectedComponent.id, {
                  position: { ...selectedComponent.position, y: parseInt(e.target.value) || 0 }
                })}
                placeholder="Y"
              />
            </div>
          </div>

          <div className="property-group">
            <Label>Text Color</Label>
            <Input
              type="color"
              value={selectedComponent.style.color || '#ffffff'}
              onChange={(e) => updateComponent(selectedComponent.id, {
                style: { ...selectedComponent.style, color: e.target.value }
              })}
            />
          </div>

          <div className="property-group">
            <Label>Border Radius</Label>
            <Slider
              value={[parseInt(selectedComponent.style.borderRadius) || 12]}
              onValueChange={(value) => updateComponent(selectedComponent.id, {
                style: { ...selectedComponent.style, borderRadius: `${value[0]}px` }
              })}
              min={0}
              max={50}
              step={1}
            />
          </div>
        </div>
      </div>
    );
  };

  if (previewMode && currentPage) {
    return (
      <div className="preview-mode">
        <div className="preview-header">
          <Button
            onClick={() => setPreviewMode(false)}
            variant="outline"
            className="glass-button"
          >
            <Settings size={16} className="mr-2" />
            Exit Preview
          </Button>
        </div>
        <div 
          className="preview-canvas"
          style={{
            background: `linear-gradient(135deg, ${backgroundColor} 0%, #000000 100%)`,
            backgroundImage: backgroundImage ? `url(${API_BASE_URL}${backgroundImage})` : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundAttachment: 'fixed',
            filter: `opacity(${backgroundEffects.fade/100}) blur(${backgroundEffects.blur}px) invert(${backgroundEffects.invert/100})`,
          }}
        >
          <div 
            className="background-vignette"
            style={{
              background: `radial-gradient(circle, transparent 0%, rgba(0,0,0,${backgroundEffects.vignette/100}) 100%)`,
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              pointerEvents: 'none'
            }}
          />
          <div className="apexone-logo">
            <img 
              src="https://customer-assets.emergentagent.com/job_minimalcraft/artifacts/0zqivsrz_APEXONE_OFFICIAL_LOGOPNG.png"
              alt="APEXONE" 
              className="logo-watermark"
            />
          </div>
          {shimmerEffect.enabled && (
            <div className="shimmer-overlay" />
          )}
          {currentPage.components?.map(renderComponent)}
        </div>
      </div>
    );
  }

  return (
    <div className={`app ${theme}`}>
      <header className="app-header glass-panel">
        <div className="header-content">
          <div className="brand">
            <img 
              src="https://customer-assets.emergentagent.com/job_minimalcraft/artifacts/5cwtb4xg_APEXONE_OFFICIAL_LOGO_AVATAR.png"
              alt="APEXONE" 
              className="brand-logo"
            />
            <div className="brand-text">
              <h1>APEXONE</h1>
              <span>HIT ONE PAGER</span>
            </div>
          </div>
          
          <div className="header-actions">
            {currentPage && (
              <>
                <Button
                  onClick={() => setPreviewMode(true)}
                  variant="outline"
                  className="glass-button"
                >
                  <Eye size={16} className="mr-2" />
                  Preview
                </Button>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="glass-button"
                    >
                      <Download size={16} className="mr-2" />
                      Export
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="glass-panel">
                    <DialogHeader>
                      <DialogTitle>📥 Export Your Page</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="export-formats">
                        <Button 
                          onClick={() => exportPage('html')} 
                          className="w-full glass-button primary mb-2"
                          disabled={isLoading}
                        >
                          {isLoading ? 'Exporting...' : '📄 Export as HTML'}
                        </Button>
                        <Button 
                          onClick={() => exportPage('json')} 
                          className="w-full glass-button mb-2"
                          disabled={isLoading}
                        >
                          {isLoading ? 'Exporting...' : '📊 Export as JSON'}
                        </Button>
                        <Button 
                          onClick={() => exportPage('iframe')} 
                          className="w-full glass-button"
                          disabled={isLoading}
                        >
                          {isLoading ? 'Exporting...' : '🖼️ Export Embed Code'}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="glass-button"
                    >
                      <Code size={16} className="mr-2" />
                      Embed
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="glass-panel">
                    <DialogHeader>
                      <DialogTitle>🔗 Get Embed Code</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="embed-formats">
                        <Button 
                          onClick={() => getEmbedCode('iframe')} 
                          className="w-full glass-button primary mb-2"
                        >
                          📱 Copy iFrame Code
                        </Button>
                        <Button 
                          onClick={() => getEmbedCode('javascript')} 
                          className="w-full glass-button mb-2"
                        >
                          ⚡ Copy JavaScript Code
                        </Button>
                        <Button 
                          onClick={() => getEmbedCode('html')} 
                          className="w-full glass-button"
                        >
                          🏷️ Copy HTML Snippet
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
                <Dialog open={ftpDialogOpen} onOpenChange={setFtpDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="glass-button">
                      <Upload size={16} className="mr-2" />
                      FTP Upload
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="glass-panel">
                    <DialogHeader>
                      <DialogTitle>🚀 FTP Upload to Your Server</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>FTP Host</Label>
                        <Input
                          value={ftpConfig.host}
                          onChange={(e) => setFtpConfig({...ftpConfig, host: e.target.value})}
                          placeholder="ftp.yourdomain.com"
                        />
                      </div>
                      <div>
                        <Label>Username</Label>
                        <Input
                          value={ftpConfig.username}
                          onChange={(e) => setFtpConfig({...ftpConfig, username: e.target.value})}
                          placeholder="your-ftp-username"
                        />
                      </div>
                      <div>
                        <Label>Password</Label>
                        <Input
                          type="password"
                          value={ftpConfig.password}
                          onChange={(e) => setFtpConfig({...ftpConfig, password: e.target.value})}
                          placeholder="your-ftp-password"
                        />
                      </div>
                      <div>
                        <Label>Remote Path</Label>
                        <Input
                          value={ftpConfig.remote_path}
                          onChange={(e) => setFtpConfig({...ftpConfig, remote_path: e.target.value})}
                          placeholder="/public_html/"
                        />
                      </div>
                      <Button 
                        onClick={uploadViaFTP} 
                        className="w-full glass-button primary"
                        disabled={isLoading}
                      >
                        {isLoading ? 'Uploading...' : '🚀 Upload to Server'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
                <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="glass-button">
                      <Mail size={16} className="mr-2" />
                      Email
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="glass-panel">
                    <DialogHeader>
                      <DialogTitle>📧 Email Your Page</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>To Email</Label>
                        <Input
                          value={emailConfig.to}
                          onChange={(e) => setEmailConfig({...emailConfig, to: e.target.value})}
                          placeholder="client@example.com"
                        />
                      </div>
                      <div>
                        <Label>Subject</Label>
                        <Input
                          value={emailConfig.subject}
                          onChange={(e) => setEmailConfig({...emailConfig, subject: e.target.value})}
                          placeholder="Your APEXONE Landing Page"
                        />
                      </div>
                      <div>
                        <Label>Message</Label>
                        <Textarea
                          value={emailConfig.message}
                          onChange={(e) => setEmailConfig({...emailConfig, message: e.target.value})}
                          placeholder="Here's your custom landing page..."
                        />
                      </div>
                      <div>
                        <Label>Email Format</Label>
                        <Select
                          value={emailConfig.format}
                          onValueChange={(value) => setEmailConfig({...emailConfig, format: value})}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="html">📄 HTML File</SelectItem>
                            <SelectItem value="json">📊 JSON Data</SelectItem>
                            <SelectItem value="iframe">🖼️ Embed Code</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button 
                        onClick={sendEmail} 
                        className="w-full glass-button primary"
                        disabled={isLoading}
                      >
                        {isLoading ? 'Sending...' : '📧 Send Email'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
                <div className="view-counter glass-effect">
                  <Eye size={14} className="mr-1" />
                  <span>{viewCount.toLocaleString()}</span>
                </div>
              </>
            )}
            <Button
              onClick={createNewPage}
              className="glass-button primary"
            >
              <PlusCircle size={16} className="mr-2" />
              New Page
            </Button>
          </div>
        </div>
      </header>

      <div className="app-body">
        <aside className="sidebar glass-panel">
          <Tabs defaultValue="components" className="sidebar-tabs">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="components">Components</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
              <TabsTrigger value="effects">Effects</TabsTrigger>
            </TabsList>

            <TabsContent value="components" className="components-tab">
              <div className="components-grid">
                {componentTypes.map((type) => (
                  <div
                    key={type.id}
                    className="component-item glass-effect"
                    draggable
                    onDragStart={() => setDraggedComponent(type.id)}
                    onClick={() => addComponent(type.id)}
                  >
                    <type.icon size={20} />
                    <span>{type.name}</span>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="settings" className="settings-tab">
              <div className="settings-content">
                <div className="setting-group">
                  <Label>Background Color</Label>
                  <Input
                    type="color"
                    value={backgroundColor}
                    onChange={(e) => {
                      setBackgroundColor(e.target.value);
                      updatePage({ background_color: e.target.value });
                    }}
                  />
                </div>

                <div className="setting-group">
                  <Label>Background Image</Label>
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    variant="outline"
                    className="w-full glass-button"
                    disabled={isLoading}
                  >
                    <Upload size={16} className="mr-2" />
                    {isLoading ? 'Uploading...' : 'Upload Image'}
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleBackgroundImageUpload}
                    className="hidden"
                  />
                </div>

                <div className="setting-group">
                  <Label>Theme</Label>
                  <div className="theme-switch">
                    <span>Light</span>
                    <Switch
                      checked={theme === 'dark'}
                      onCheckedChange={(checked) => {
                        const newTheme = checked ? 'dark' : 'light';
                        setTheme(newTheme);
                        updatePage({ theme: newTheme });
                      }}
                    />
                    <span>Dark</span>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="effects" className="effects-tab">
              <div className="effects-content">
                <div className="effect-group">
                  <Label>Image Fade ({backgroundEffects.fade}%)</Label>
                  <Slider
                    value={[backgroundEffects.fade]}
                    onValueChange={(value) => setBackgroundEffects({...backgroundEffects, fade: value[0]})}
                    min={0}
                    max={100}
                    step={1}
                  />
                </div>

                <div className="effect-group">
                  <Label>Image Blur ({backgroundEffects.blur}px)</Label>
                  <Slider
                    value={[backgroundEffects.blur]}
                    onValueChange={(value) => setBackgroundEffects({...backgroundEffects, blur: value[0]})}
                    min={0}
                    max={20}
                    step={1}
                  />
                </div>

                <div className="effect-group">
                  <Label>Image Invert ({backgroundEffects.invert}%)</Label>
                  <Slider
                    value={[backgroundEffects.invert]}
                    onValueChange={(value) => setBackgroundEffects({...backgroundEffects, invert: value[0]})}
                    min={0}
                    max={100}
                    step={1}
                  />
                </div>

                <div className="effect-group">
                  <Label>Vignette ({backgroundEffects.vignette}%)</Label>
                  <Slider
                    value={[backgroundEffects.vignette]}
                    onValueChange={(value) => setBackgroundEffects({...backgroundEffects, vignette: value[0]})}
                    min={0}
                    max={100}
                    step={1}
                  />
                </div>

                <Separator />

                <div className="effect-group">
                  <div className="shimmer-header">
                    <Label>
                      <Sparkles size={16} className="inline mr-2" />
                      Page Shimmer Effect
                    </Label>
                    <Switch
                      checked={shimmerEffect.enabled}
                      onCheckedChange={(checked) => setShimmerEffect({...shimmerEffect, enabled: checked})}
                    />
                  </div>
                  
                  {shimmerEffect.enabled && (
                    <>
                      <div className="shimmer-controls">
                        <Label>Intensity ({shimmerEffect.intensity}%)</Label>
                        <Slider
                          value={[shimmerEffect.intensity]}
                          onValueChange={(value) => setShimmerEffect({...shimmerEffect, intensity: value[0]})}
                          min={0}
                          max={100}
                          step={5}
                        />
                      </div>
                      
                      <div className="shimmer-controls">
                        <Label>Frequency ({shimmerEffect.frequency/1000}s)</Label>
                        <Slider
                          value={[shimmerEffect.frequency]}
                          onValueChange={(value) => setShimmerEffect({...shimmerEffect, frequency: value[0]})}
                          min={2000}
                          max={15000}
                          step={1000}
                        />
                      </div>

                      <div className="shimmer-controls">
                        <Label>Shimmer Color</Label>
                        <Input
                          type="color"
                          value={shimmerEffect.color}
                          onChange={(e) => setShimmerEffect({...shimmerEffect, color: e.target.value})}
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </aside>

        <main className="canvas-area">
          {currentPage ? (
            <div
              ref={canvasRef}
              className="canvas"
              onDrop={handleCanvasDrop}
              onDragOver={(e) => e.preventDefault()}
              style={{
                background: `linear-gradient(135deg, ${backgroundColor} 0%, #000000 100%)`,
                backgroundImage: backgroundImage ? `url(${API_BASE_URL}${backgroundImage})` : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                filter: `opacity(${backgroundEffects.fade/100}) blur(${backgroundEffects.blur}px) invert(${backgroundEffects.invert/100})`,
              }}
            >
              <div 
                className="background-vignette"
                style={{
                  background: `radial-gradient(circle, transparent 0%, rgba(0,0,0,${backgroundEffects.vignette/100}) 100%)`,
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  pointerEvents: 'none'
                }}
              />
              <div className="apexone-logo">
                <img 
                  src="https://customer-assets.emergentagent.com/job_minimalcraft/artifacts/0zqivsrz_APEXONE_OFFICIAL_LOGOPNG.png"
                  alt="APEXONE" 
                  className="logo-watermark"
                />
              </div>
              {shimmerEffect.enabled && (
                <div className="shimmer-overlay" />
              )}
              {currentPage.components?.map(renderComponent)}
              
              {!currentPage.components?.length && (
                <div className="canvas-empty-state">
                  <div className="empty-message glass-effect">
                    <h3>Start Building</h3>
                    <p>Drag components from the sidebar or click to add them</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="no-page-selected">
              <div className="welcome-message glass-effect">
                <h2>Welcome to APEXONE</h2>
                <p>Create stunning one-page sites with professional effects</p>
                <Button
                  onClick={createNewPage}
                  className="glass-button primary"
                  size="lg"
                >
                  <PlusCircle size={20} className="mr-2" />
                  Create Your First Page
                </Button>
              </div>
            </div>
          )}
        </main>

        <aside className="properties-sidebar glass-panel">
          <ComponentPropertiesPanel />
        </aside>
      </div>
    </div>
  );
}

export default App;