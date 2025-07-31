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
  Settings
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
  const [backgroundColor, setBackgroundColor] = useState('#1a1a2e');
  const [theme, setTheme] = useState('dark');
  const [royaltyFreeSounds, setRoyaltyFreeSounds] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  // Component types available in the builder
  const componentTypes = [
    { id: 'text', name: 'Text', icon: Type, description: 'Add headings and paragraphs' },
    { id: 'button', name: 'Button', icon: MousePointer, description: 'Call-to-action buttons' },
    { id: 'form', name: 'Form', icon: FormInput, description: 'Data collection forms' },
    { id: 'timer', name: 'Timer', icon: Timer, description: 'Countdown timers' },
    { id: 'audio', name: 'Audio', icon: Music, description: 'Music and sound effects' },
    { id: 'video', name: 'Video', icon: Video, description: 'Video embeds' },
    { id: 'logo', name: 'Logo', icon: ImageIcon, description: 'Brand logos and images' },
  ];

  // Load initial data
  useEffect(() => {
    fetchPages();
    fetchRoyaltyFreeSounds();
  }, []);

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
        title: `Page ${pages.length + 1}`,
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
        return { text: 'Your text here', tag: 'p' };
      case 'button':
        return { text: 'Click Me', action: 'alert("Button clicked!")' };
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
      default:
        return {};
    }
  };

  const getDefaultStyle = (type) => {
    const baseStyle = {
      color: theme === 'dark' ? '#ffffff' : '#000000',
      background: 'rgba(255, 255, 255, 0.1)',
      borderRadius: '12px',
      backdropFilter: 'blur(12px)',
      border: '1px solid rgba(255, 255, 255, 0.2)'
    };

    switch (type) {
      case 'text':
        return { ...baseStyle, fontSize: 16, fontWeight: 'normal' };
      case 'button':
        return { 
          ...baseStyle, 
          padding: '12px 24px', 
          fontSize: 14, 
          fontWeight: 'medium',
          cursor: 'pointer',
          transition: 'all 0.3s ease'
        };
      default:
        return baseStyle;
    }
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
      position: { x: x - 50, y: y - 25 }, // Center the component on cursor
      style: getDefaultStyle(type)
    };

    const updatedComponents = [...(currentPage.components || []), newComponent];
    updatePage({ components: updatedComponents });
  };

  const updateComponent = (componentId, updates) => {
    if (!currentPage) return;

    const updatedComponents = currentPage.components.map(comp =>
      comp.id === componentId ? { ...comp, ...updates } : comp
    );
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

  const exportPage = async () => {
    if (!currentPage) return;

    try {
      const response = await axios.post(`${API_BASE_URL}/api/pages/${currentPage.id}/export`, {}, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${currentPage.title.replace(' ', '_')}.html`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error exporting page:', error);
    }
  };

  const getEmbedCode = async () => {
    if (!currentPage) return;

    try {
      const response = await axios.post(`${API_BASE_URL}/api/pages/${currentPage.id}/embed-code`);
      navigator.clipboard.writeText(response.data.embed_code);
      alert('Embed code copied to clipboard!');
    } catch (error) {
      console.error('Error getting embed code:', error);
    }
  };

  const renderComponent = (component) => {
    const { type, content, position, style } = component;
    const commonStyle = {
      position: 'absolute',
      left: `${position.x}px`,
      top: `${position.y}px`,
      cursor: 'move',
      ...style
    };

    switch (type) {
      case 'text':
        const Tag = content.tag || 'p';
        return (
          <Tag
            key={component.id}
            style={commonStyle}
            onClick={() => setSelectedComponent(component)}
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
            onClick={() => setSelectedComponent(component)}
            className={`component glass-button ${selectedComponent?.id === component.id ? 'selected' : ''}`}
          >
            {content.text || 'Button'}
          </button>
        );

      case 'timer':
        return (
          <div
            key={component.id}
            style={commonStyle}
            onClick={() => setSelectedComponent(component)}
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
            onClick={() => setSelectedComponent(component)}
            className={`component glass-effect ${selectedComponent?.id === component.id ? 'selected' : ''}`}
          >
            <div className="audio-player">
              <Play size={16} />
              <span>Audio Player</span>
            </div>
          </div>
        );

      default:
        return (
          <div
            key={component.id}
            style={commonStyle}
            onClick={() => setSelectedComponent(component)}
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
          {selectedComponent.type === 'text' && (
            <>
              <div className="property-group">
                <Label>Text Content</Label>
                <Textarea
                  value={selectedComponent.content.text || ''}
                  onChange={(e) => updateComponent(selectedComponent.id, {
                    content: { ...selectedComponent.content, text: e.target.value }
                  })}
                  placeholder="Enter your text..."
                />
              </div>
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
            <>
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
            backgroundAttachment: 'fixed'
          }}
        >
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
            <h1>ONEderpage</h1>
            <span>Landing Page Builder</span>
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
                <Button
                  onClick={exportPage}
                  variant="outline"
                  className="glass-button"
                >
                  <Download size={16} className="mr-2" />
                  Export
                </Button>
                <Button
                  onClick={getEmbedCode}
                  variant="outline"
                  className="glass-button"
                >
                  <Code size={16} className="mr-2" />
                  Embed
                </Button>
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
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="components">Components</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
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
                backgroundPosition: 'center'
              }}
            >
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
                <h2>Welcome to ONEderpage</h2>
                <p>Create stunning landing pages with glass morphism design</p>
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