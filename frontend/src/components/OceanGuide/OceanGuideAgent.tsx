/**
 * OceanGuideAgent.tsx
 * Interactive Layman AI Ocean Guide for OCEAN-X (SAGAR-VIEW).
 *
 * Specifically designed for non-specialists, students, evaluators, and coastal citizens:
 * 1. Live Screen Awareness: Dynamically explains what is currently visible on the 3D globe in plain everyday language.
 * 2. Real-World Analogies: Uses memorable metaphors (hot soup thermos, underwater weather balloons, cyclone battery).
 * 3. Interactive Web Actions: The AI can actually drive the website for the user (navigate to cyclone hotspots, dive 100m deep, toggle currents, show river plumes).
 * 4. Conversational Layman Q&A: Answers any typed question simply with text-to-speech audio narration support.
 */

import React, { useState, useEffect, useRef } from 'react';
import type { OceanVariable } from '../../types';
import './OceanGuideAgent.css';

export interface OceanGuideAgentProps {
  isOpen: boolean;
  onToggle: () => void;
  variable: string;
  depth: number;
  currentSector: string;
  selectedProfileId: string | null;
  showCurrents: boolean;
  showTCHP: boolean;
  productMode: string;
  probedCoord: { lat: number; lon: number } | null;
  onSetVariable: (v: OceanVariable) => void;
  onSetDepth: (d: number) => void;
  onSelectSector: (s: any) => void;
  onToggleCurrents: () => void;
  onToggleTCHP: () => void;
  onSelectArgo: (id: string) => void;
  onSetProductMode: (mode: any) => void;
  onOpenTransect: () => void;
}

interface ChatMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const OceanGuideAgent: React.FC<OceanGuideAgentProps> = ({
  isOpen,
  onToggle,
  variable,
  depth,
  currentSector,
  selectedProfileId,
  showCurrents,
  showTCHP,
  productMode,
  probedCoord,
  onSetVariable,
  onSetDepth,
  onSelectSector,
  onToggleCurrents,
  onToggleTCHP,
  onSelectArgo,
  onSetProductMode,
  onOpenTransect,
}) => {
  const [activeTab, setActiveTab] = useState<'screen' | 'chat' | 'tours' | 'glossary'>('screen');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: "👋 Hi! I'm your SAGAR AI Guide. Ocean science can feel overwhelming with all the numbers and grids. I translate everything you see into simple, everyday language. Ask me anything or click a tour below!",
    },
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechAvailable, setSpeechAvailable] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setSpeechAvailable(true);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'chat') {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeTab]);

  // Read out current text using Web Speech API
  const handleSpeak = (textToSpeak: string) => {
    if (!speechAvailable) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();
    const cleanText = textToSpeak
      .replace(/[*_#`[\]()]/g, '')
      .replace(/(\+|-)\d+(\.\d+)?°C/g, (m) => m.replace('°C', ' degrees Celsius'));

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.pitch = 1.05;

    const voices = window.speechSynthesis.getVoices();
    const enVoice = voices.find((v) => v.lang.startsWith('en')) || voices[0];
    if (enVoice) utterance.voice = enVoice;

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  // 1. Dynamic Live Screen Explanation Generator (Plain Layman Terms)
  const getLiveScreenExplanation = () => {
    const parts: { title: string; body: string; icon: string; highlight?: string; action?: () => void; actionText?: string }[] = [];

    // Selected float
    if (selectedProfileId) {
      if (selectedProfileId === '2902345' || selectedProfileId.includes('2902345')) {
        parts.push({
          icon: '🚨',
          title: 'Selected: Critical Thermal Anomaly (Float #2902345)',
          body: "You clicked on a robotic probe floating in the Central Bay of Bengal. The supercomputer model thought water would be 26.5°C here, but this robot actually measured 29.2°C at 100m depth! That is a huge +2.7°C hidden heat bubble that satellites completely missed.",
          highlight: 'Dangerous Subsurface Heatwave (+2.7°C)',
          action: () => onSetDepth(100),
          actionText: 'Dive 100m to inspect this heat bubble',
        });
      } else {
        parts.push({
          icon: '🤖',
          title: `Selected In-Situ Platform #${selectedProfileId}`,
          body: `You are inspecting a physical ocean sensor deployed by INCOIS. It records live water temperature and saltiness down to 2,000 meters and transmits its ground-truth findings back to satellites.`,
        });
      }
    }

    // Probed coordinate
    if (probedCoord) {
      parts.push({
        icon: '📍',
        title: `Probed Ocean Coordinate (${probedCoord.lat.toFixed(2)}°N, ${probedCoord.lon.toFixed(2)}°E)`,
        body: `You dropped an oceanographic probe at this spot. The 3D subsurface water column slices down through depth layers to reveal the vertical temperature structure.`,
      });
    }

    // TCHP / Cyclone Energy
    if (showTCHP) {
      parts.push({
        icon: '🌀',
        title: 'Layer: Cyclone Fuel (Tropical Cyclone Heat Potential)',
        body: "Think of this like the ocean's battery charge! Tropical cyclones get their destructive power by drinking heat from the ocean. Gold and purple areas have stored energy over 50 kJ/cm² — enough to rapidly turn an ordinary storm into a monster super-cyclone overnight.",
        highlight: 'Areas > 50 kJ/cm² trigger Rapid Cyclone Intensification alerts',
      });
    } else if (variable === 'thetao') {
      if (depth === 0) {
        parts.push({
          icon: '🌡️',
          title: 'Layer: Sea Surface Temperature (0m)',
          body: "You're looking at the very surface of the ocean. The warm orange/red areas (above 28°C) around India are naturally warm tropical waters. But looking only at the surface is like checking the crust of a hot soup—the real fuel is trapped deeper down!",
          action: () => onSetDepth(100),
          actionText: 'Dive 100m down to see what lies underneath',
        });
      } else if (depth >= 50 && depth <= 150) {
        parts.push({
          icon: '🤿',
          title: `Layer: Subsurface Ocean (${depth}m Depth — The Thermocline)`,
          body: `You have dived ${depth} meters underwater! This is the transition zone where warm surface water meets the cold abyss. When mesoscale eddies trap heat here, cyclones can feed on it without cooling down. Surface satellites cannot see this depth at all!`,
          highlight: `Currently slicing at ${depth} meters below sea level`,
        });
      } else {
        parts.push({
          icon: '⚓',
          title: `Layer: Deep Ocean (${depth}m Depth)`,
          body: `At ${depth} meters deep, sunlight never reaches. The water drops to between 7°C and 12°C. This cold deep reservoir stabilizes the ocean and buffers our planet's climate.`,
        });
      }
    } else if (variable === 'so') {
      parts.push({
        icon: '🧂',
        title: 'Layer: Ocean Saltiness (Salinity)',
        body: "This shows how salty the water is. Notice the lighter green patch in the Northern Bay of Bengal? That is millions of tons of fresh river water pouring in from the Ganges and Brahmaputra rivers! Fresh water is lighter than salt water, so it floats on top like a blanket, trapping heat underneath.",
        highlight: 'Freshwater river plumes act like a thermal blanket',
      });
    }

    // Currents
    if (showCurrents) {
      parts.push({
        icon: '🌊',
        title: 'Current Streamlines Active',
        body: "Those 500 animated flowing lines are like giant underwater rivers! They move trillions of liters of water, shaping monsoon weather patterns and guiding where fishermen find schools of fish.",
      });
    }

    // Basin / Sector
    if (currentSector === 'bay_of_bengal') {
      parts.push({
        icon: '📍',
        title: 'Focus: Bay of Bengal Basin',
        body: "Surrounded by land on three sides and fed by giant rivers, the Bay of Bengal is one of the world's most cyclone-prone bodies of water because of its warm surface layer and freshwater cap.",
      });
    } else if (currentSector === 'arabian_sea') {
      parts.push({
        icon: '📍',
        title: 'Focus: Arabian Sea Basin',
        body: "The Arabian Sea is saltier and has strong deep-water upwelling along the western coast during the summer monsoon, cooling the surface water and bringing up nutrients.",
      });
    }

    // Product Mode
    if (productMode === 'operational') {
      parts.push({
        icon: '🚨',
        title: 'Mode: Disaster Situation Room',
        body: "You are in command center mode. This view monitors active storm hazards, cyclone rapid intensification risk, and active sensor fleet readiness for disaster management authorities like the Navy, Coast Guard, and NDRF.",
      });
    } else if (productMode === 'sounding') {
      parts.push({
        icon: '📊',
        title: 'Mode: High-Definition Sounding Studio',
        body: "This full-page studio lets you compare the computer's prediction against the real robotic measurement from surface down to 500m depth. The red shaded zone highlights where the computer was wrong.",
      });
    }

    return parts;
  };

  // 2. Layman Guided Action Tours
  const GUIDED_TOURS = [
    {
      id: 'anomaly',
      icon: '🚨',
      title: 'Find the Dangerous Cyclone Heat Bubble',
      desc: 'Jump directly to Float #2902345 in the Bay of Bengal and dive 100m deep to see hidden heat that satellites missed.',
      action: () => {
        onSelectSector('anomaly_target');
        onSetDepth(100);
        onSetVariable('thetao');
        addAiMessage(
          "🎯 **Here it is!** We just jumped to Argo Float #2902345 in the Central Bay of Bengal and set depth to 100 meters.\n\nNotice that large warm patch? That's a +2.7°C subsurface heat anomaly. If a cyclone passes over this, it will rapidly intensify because this heat reservoir feeds the storm!"
        );
      },
    },
    {
      id: 'currents',
      icon: '🌊',
      title: 'Turn on Moving Ocean Rivers',
      desc: 'Activate animated particle streamlines showing the massive currents flowing across the Indian Ocean.',
      action: () => {
        if (!showCurrents) onToggleCurrents();
        addAiMessage(
          "🌊 **Ocean currents are now flowing!** Those glowing stream ribbons show water moving across the Arabian Sea and Bay of Bengal. Notice the swirling gyre in the central basin—this circulation transports heat and nutrients across thousands of kilometers."
        );
      },
    },
    {
      id: 'tchp',
      icon: '🌀',
      title: 'Inspect Cyclone Fuel (TCHP)',
      desc: 'Switch to the Tropical Cyclone Heat Potential map to see the ocean battery charge down to 26°C.',
      action: () => {
        if (!showTCHP) onToggleTCHP();
        addAiMessage(
          "🌀 **Cyclone Fuel (TCHP) activated!** Any zone colored gold or purple has stored heat over 50 kJ/cm² down to the 26°C depth. This is the international threshold where forecasters issue Rapid Intensification warnings for incoming storms."
        );
      },
    },
    {
      id: 'salinity',
      icon: '🧂',
      title: 'See Fresh River Water vs Salt Water',
      desc: 'Switch to salinity to see how the Ganges and Brahmaputra rivers pour into the northern bay.',
      action: () => {
        onSetVariable('so');
        onSelectSector('bay_of_bengal');
        addAiMessage(
          "🧂 **Salinity view enabled!** Look at the light green plume in the northern Bay of Bengal. That is fresh water pouring out from Indian and Bangladeshi rivers. Because it is less dense than salt water, it acts like a blanket, trapping heat underneath and accelerating cyclone formation."
        );
      },
    },
    {
      id: 'dive',
      icon: '🤿',
      title: 'Take a 100-Meter Deep Dive',
      desc: 'Peel back the ocean surface down to 100m depth to see the underwater thermocline.',
      action: () => {
        onSetDepth(100);
        onSetVariable('thetao');
        addAiMessage(
          "🤿 **Dived to 100 meters!** You are now looking at the subsurface layer. Notice how different this looks compared to the surface—this is where ocean temperature changes drastically and where underwater heat gets trapped."
        );
      },
    },
    {
      id: 'surface',
      icon: '☀️',
      title: 'Return to Ocean Surface (0m)',
      desc: 'Bring the water layer back up to sea level.',
      action: () => {
        onSetDepth(0);
        addAiMessage("☀️ **Back to the surface!** You are viewing sea surface temperatures across India's oceans.");
      },
    },
    {
      id: 'transect',
      icon: '⟂',
      title: 'Slice the Ocean (2D Cross-Section)',
      desc: 'Open the 2D vertical transect tool to slice the ocean from Chennai to Port Blair like a cake.',
      action: () => {
        onOpenTransect();
        addAiMessage("⟂ **Vertical Transect opened!** This slices through the ocean from west to east so you can see the thermocline depth slope from surface down to 500m.");
      },
    },
    {
      id: 'sounding',
      icon: '📊',
      title: 'Open Dedicated Sounding Studio',
      desc: 'Inspect full 0-500m model vs observation sounding curves, 70-layer data matrix, and CSV export.',
      action: () => {
        onSetProductMode('sounding');
        addAiMessage(
          "📊 **Sounding Studio opened!** Here you can inspect high-resolution depth soundings comparing the computer's prediction against real robotic measurements with zero UI clutter."
        );
      },
    },
  ];

  // 3. Conversational AI Layman Q&A Handler
  const handleAskQuestion = (question: string) => {
    if (!question.trim()) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: question,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');

    setTimeout(() => {
      const reply = generateLaymanAnswer(question.toLowerCase());
      addAiMessage(reply.text, reply.actionLabel, reply.onAction);
    }, 300);
  };

  const addAiMessage = (text: string, actionLabel?: string, onAction?: () => void) => {
    const aiMsg: ChatMessage = {
      id: `ai-${Date.now()}`,
      sender: 'ai',
      text,
      actionLabel,
      onAction,
    };
    setMessages((prev) => [...prev, aiMsg]);
  };

  const generateLaymanAnswer = (
    q: string
  ): { text: string; actionLabel?: string; onAction?: () => void } => {
    // 1. Hot soup / metaphor
    if (q.includes('soup') || q.includes('analogy') || q.includes('coffee') || q.includes('metaphor')) {
      return {
        text: "☕ **The Hot Soup Analogy**: Imagine a hot bowl of soup on a cold morning. After a few minutes, a cool, thin skin forms on top. It looks harmless from above, but if you dip your spoon in, it's scalding hot underneath! The ocean does the exact same thing: satellites only see the top 1 millimeter 'skin', completely missing the boiling heat trapped 100 meters underwater.",
      };
    }

    // 2. Cyclones & Rapid Intensification
    if (q.includes('cyclone') || q.includes('storm') || q.includes('danger') || q.includes('fani') || q.includes('mocha') || q.includes('intensif')) {
      return {
        text: "🌀 **Why cyclones explode overnight**: Cyclones are massive heat engines. When a storm passes over warm surface water, it stirs up cold water from below and slows down. BUT if the water 100 meters deep is ALSO boiling hot (a subsurface heatwave), stirring it up just feeds the cyclone even more! It drinks this heat like rocket fuel, jumping from a mild storm to a Category-5 supercyclone within 24 hours.",
        actionLabel: '🎯 Show me the cyclone heat hotspot',
        onAction: () => {
          onSelectSector('anomaly_target');
          onSetDepth(100);
        },
      };
    }

    // 3. Argo floats / robots
    if (q.includes('argo') || q.includes('float') || q.includes('robot') || q.includes('beacon') || q.includes('ring') || q.includes('dot')) {
      return {
        text: "🤖 **Robotic Ocean Weather Balloons**: Those pulsing dots in the ocean are Argo profiling floats and OMNI buoys. Argo floats are robotic cylinders that sink 2,000 meters down into the ocean abyss, slowly drift, and then float back to the surface every 10 days measuring temperature and saltiness. When they reach the surface, they text message their data to satellites!",
        actionLabel: 'Select Critical Float #2902345',
        onAction: () => onSelectArgo('2902345'),
      };
    }

    // 4. Satellites vs Underwater
    if (q.includes('satellite') || q.includes('skin') || q.includes('blind') || q.includes('space')) {
      return {
        text: "🛰️ **The Satellite Blind Spot**: Satellites in space use infrared and microwave cameras to measure sea temperature. But ocean water completely absorbs these light waves in the top 1 millimeter! Satellites cannot see even 1 meter deep, let alone 100 meters. That's why satellite weather forecasts sometimes get surprised by sudden monster cyclones.",
      };
    }

    // 5. INCOIS
    if (q.includes('incois') || q.includes('ministry') || q.includes('government') || q.includes('sih') || q.includes('who made')) {
      return {
        text: "🏛️ **About INCOIS**: INCOIS (Indian National Centre for Ocean Information Services) is the Indian government's premier ocean intelligence institute in Hyderabad, under the Ministry of Earth Sciences. They run the National Tsunami Warning Centre, issue daily advisories to millions of fishermen, and forecast cyclone ocean conditions for India's 7,500 km coastline.",
      };
    }

    // 6. Fishermen
    if (q.includes('fish') || q.includes('boat') || q.includes('coast') || q.includes('life') || q.includes('people')) {
      return {
        text: "🎣 **How this saves lives & helps fishermen**: 1) Early cyclone warnings give coastal villages days of extra evacuation time. 2) Fishermen avoid dangerous ocean currents that could wreck small boats. 3) Ocean boundary lines (where warm and cool currents meet) are rich in plankton, showing fishermen the best, safest fishing zones.",
      };
    }

    // 7. Depth slider
    if (q.includes('depth') || q.includes('slider') || q.includes('deep') || q.includes('meter') || q.includes('dive')) {
      return {
        text: "🤿 **How Depth Works**: At the bottom of the screen is a depth slider (0m, 50m, 100m, 200m, 500m). Moving this slider lets you slice through the ocean like a medical CT scan! 0m is the surface where ships float, 100m is the thermocline where cyclones get their energy, and 500m is the freezing deep sea.",
        actionLabel: 'Dive to 100m now',
        onAction: () => onSetDepth(100),
      };
    }

    // 8. Currents
    if (q.includes('current') || q.includes('river') || q.includes('flow') || q.includes('line') || q.includes('arrow')) {
      return {
        text: "🌊 **Ocean Currents**: Those glowing, moving ribbons represent massive currents moving billions of gallons of water. In the Indian Ocean, currents actually reverse direction twice a year because of the monsoon winds!",
        actionLabel: 'Toggle currents on/off',
        onAction: () => onToggleCurrents(),
      };
    }

    // 9. Salinity / Salt
    if (q.includes('salt') || q.includes('salin') || q.includes('fresh') || q.includes('ganga') || q.includes('river')) {
      return {
        text: "🧂 **The River Blanket**: The northern Bay of Bengal gets fresh water from the Ganga and Brahmaputra rivers. Because fresh water is lighter than salty water, it stays on top like oil on water. This 'river blanket' prevents wind from mixing the ocean, locking scalding heat inside the subsurface layer!",
        actionLabel: 'Show Salinity Layer',
        onAction: () => {
          onSetVariable('so');
          onSelectSector('bay_of_bengal');
        },
      };
    }

    // 10. Explain like I'm 10 / 5
    if (q.includes('10') || q.includes('5') || q.includes('simple') || q.includes('child') || q.includes('kid')) {
      return {
        text: "👦 **For a 10-Year-Old**: Think of this website like Google Earth, but with X-ray vision for the ocean! Instead of just seeing the surface where boats sail, you can dive underwater and see secret swimming robots measuring temperature. If the water deep down gets too hot, it acts like a volcano battery that turns small storms into monster cyclones!",
      };
    }

    // 11. Navigation / How to use
    if (q.includes('how to') || q.includes('use') || q.includes('operate') || q.includes('rotate') || q.includes('controls')) {
      return {
        text: "🎮 **How to operate the 3D Globe**: 1) Left-click and drag anywhere on the Earth to spin it. 2) Mouse wheel or pinch to zoom in and out. 3) Click any glowing dot to see what that underwater robot discovered. 4) Use the buttons in this AI Guide window to take instant guided tours!",
      };
    }

    // Default fallback answer
    return {
      text: `💡 **Here is what's happening**: You're exploring the Indian Ocean using real computer models and robotic sensor buoys. Currently, you are viewing **${
        variable === 'thetao'
          ? 'Water Temperature'
          : variable === 'so'
          ? 'Salinity (Saltiness)'
          : variable === 'tchp'
          ? 'Cyclone Fuel (TCHP)'
          : 'Ocean Currents'
      }** at **${depth} meters depth**. Click any of the tours below to explore interesting hotspots!`,
      actionLabel: 'Take me to the Anomaly Hotspot',
      onAction: () => {
        onSelectSector('anomaly_target');
        onSetDepth(100);
      },
    };
  };

  const liveParts = getLiveScreenExplanation();

  return (
    <aside className="ocean-guide-container" aria-label="SAGAR AI Ocean Guide Assistant">
      {/* Floating Trigger Pill (When minimized) */}
      {!isOpen && (
        <button
          className="guide-trigger-pill"
          onClick={onToggle}
          title="Open AI Ocean Guide — Simple layman explanation of what you are seeing"
        >
          <div className="pill-avatar-wrap">
            <span className="pill-avatar">🤖</span>
            <span className="pill-pulse-ring" />
          </div>
          <div className="pill-text-col">
            <span className="pill-title">AI OCEAN GUIDE</span>
            <span className="pill-subtitle">What am I looking at? Click me!</span>
          </div>
          <span className="pill-chevron">▲</span>
        </button>
      )}

      {/* Expanded Assistant Window */}
      {isOpen && (
        <div className="guide-panel" role="region" aria-label="AI Ocean Guide Panel">
          {/* Header */}
          <div className="guide-header">
            <div className="guide-header-title-wrap">
              <div className="guide-avatar-badge">
                <span>🤖</span>
              </div>
              <div className="guide-title-meta">
                <div className="guide-title-row">
                  <h3>SAGAR AI GUIDE</h3>
                  <span className="layman-badge">LAYMAN TRANSLATOR</span>
                </div>
                <p className="guide-subtitle">Plain-English explanations for everyone</p>
              </div>
            </div>

            <div className="guide-header-actions">
              {speechAvailable && (
                <button
                  className={`guide-icon-btn ${isSpeaking ? 'speaking' : ''}`}
                  onClick={() => {
                    const allText = liveParts.map((p) => `${p.title}. ${p.body}`).join(' ');
                    handleSpeak(allText);
                  }}
                  title={isSpeaking ? 'Stop voice readout' : 'Read explanation out loud'}
                >
                  {isSpeaking ? '🔊 Speaking...' : '🔈 Read Out'}
                </button>
              )}
              <button className="guide-icon-btn close-btn" onClick={onToggle} title="Minimize Guide">
                ✕
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="guide-tabs">
            <button
              className={`guide-tab ${activeTab === 'screen' ? 'active' : ''}`}
              onClick={() => setActiveTab('screen')}
            >
              💡 What's On Screen
            </button>
            <button
              className={`guide-tab ${activeTab === 'chat' ? 'active' : ''}`}
              onClick={() => setActiveTab('chat')}
            >
              💬 Ask Anything
            </button>
            <button
              className={`guide-tab ${activeTab === 'tours' ? 'active' : ''}`}
              onClick={() => setActiveTab('tours')}
            >
              🚀 Guided Tours
            </button>
            <button
              className={`guide-tab ${activeTab === 'glossary' ? 'active' : ''}`}
              onClick={() => setActiveTab('glossary')}
            >
              📖 Simple Cheat Sheet
            </button>
          </div>

          {/* Tab 1: Live What's On Screen Explanation */}
          {activeTab === 'screen' && (
            <div className="guide-body screen-tab">
              <div className="live-status-chip">
                <span className="live-status-dot" />
                <span>
                  LIVE CONTEXT: {variable.toUpperCase()} AT {depth}M DEPTH
                </span>
              </div>

              <div className="screen-cards-list">
                {liveParts.map((part, idx) => (
                  <div key={`part-${idx}`} className="screen-card">
                    <div className="card-header">
                      <span className="card-icon">{part.icon}</span>
                      <h4 className="card-title">{part.title}</h4>
                    </div>
                    <p className="card-body">{part.body}</p>
                    {part.highlight && (
                      <div className="card-highlight">
                        <span>⚡ {part.highlight}</span>
                      </div>
                    )}
                    {part.action && (
                      <button
                        className="card-action-btn"
                        onClick={part.action}
                      >
                        👉 {part.actionText || 'Take me there'}
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Quick Prompt Questions */}
              <div className="quick-prompts-section">
                <span className="prompts-label">Common questions about this view:</span>
                <div className="prompts-chips">
                  <button
                    className="prompt-chip"
                    onClick={() => {
                      setActiveTab('chat');
                      handleAskQuestion('Why is the ocean warmer here?');
                    }}
                  >
                    Why is the ocean warmer here?
                  </button>
                  <button
                    className="prompt-chip"
                    onClick={() => {
                      setActiveTab('chat');
                      handleAskQuestion('What is the hot soup analogy?');
                    }}
                  >
                    Explain the hot soup analogy
                  </button>
                  <button
                    className="prompt-chip"
                    onClick={() => {
                      setActiveTab('chat');
                      handleAskQuestion("Explain like I'm 10 years old");
                    }}
                  >
                    Explain like I'm 10
                  </button>
                  <button
                    className="prompt-chip"
                    onClick={() => {
                      setActiveTab('chat');
                      handleAskQuestion('Why cant satellites see underwater?');
                    }}
                  >
                    Why can't satellites see below water?
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Conversational Layman Chat */}
          {activeTab === 'chat' && (
            <div className="guide-body chat-tab">
              <div className="chat-messages-container">
                {messages.map((msg) => (
                  <div key={msg.id} className={`chat-message-row ${msg.sender}`}>
                    <div className="chat-bubble">
                      <p className="chat-bubble-text">{msg.text}</p>
                      {msg.actionLabel && msg.onAction && (
                        <button
                          className="bubble-action-btn"
                          onClick={msg.onAction}
                        >
                          👉 {msg.actionLabel}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                <div ref={chatBottomRef} />
              </div>

              {/* Chat input box */}
              <form
                className="chat-input-row"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleAskQuestion(inputQuery);
                }}
              >
                <input
                  type="text"
                  className="chat-input"
                  placeholder="Ask any question in plain English..."
                  value={inputQuery}
                  onChange={(e) => setInputQuery(e.target.value)}
                />
                <button
                  type="submit"
                  className="chat-send-btn"
                  disabled={!inputQuery.trim()}
                >
                  Send
                </button>
              </form>
            </div>
          )}

          {/* Tab 3: Interactive Guided Tours */}
          {activeTab === 'tours' && (
            <div className="guide-body tours-tab">
              <p className="tours-intro">
                Click any tour below and the AI Guide will navigate the 3D globe, dive underwater, and explain what is happening:
              </p>
              <div className="tours-grid">
                {GUIDED_TOURS.map((tour) => (
                  <div key={tour.id} className="tour-card" onClick={tour.action}>
                    <div className="tour-card-header">
                      <span className="tour-icon">{tour.icon}</span>
                      <h4 className="tour-title">{tour.title}</h4>
                    </div>
                    <p className="tour-desc">{tour.desc}</p>
                    <button className="tour-start-btn">Start Tour →</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 4: Layman Cheat Sheet / Glossary */}
          {activeTab === 'glossary' && (
            <div className="guide-body glossary-tab">
              <div className="glossary-item">
                <h4>🌡️ Thermocline</h4>
                <p>The underwater layer (around 80–150 meters) where warm surface water quickly turns cold. This is where dangerous cyclone heat gets trapped.</p>
              </div>
              <div className="glossary-item">
                <h4>🌀 TCHP (Cyclone Heat Potential)</h4>
                <p>Think of it as the ocean's battery charge. The more heat trapped above 26°C, the more explosive energy a cyclone has to turn into a super-storm.</p>
              </div>
              <div className="glossary-item">
                <h4>🤖 Argo Profiling Floats</h4>
                <p>Underwater robotic weather balloons! They dive 2,000 meters into the abyss and surface every 10 days to text message real temperature readings to satellites.</p>
              </div>
              <div className="glossary-item">
                <h4>🛰️ Satellite Skin Effect</h4>
                <p>Satellites can only see the top 1 millimeter of the water. They are completely blind to heat hiding 100 meters underwater.</p>
              </div>
              <div className="glossary-item">
                <h4>🧂 Salinity Barrier Layer</h4>
                <p>When rivers like the Ganga pour fresh water into the sea, the light fresh water sits on top like a blanket, trapping boiling heat underneath.</p>
              </div>
              <div className="glossary-item">
                <h4>🏛️ INCOIS</h4>
                <p>India's premier ocean science agency (Ministry of Earth Sciences, Hyderabad) that protects fishermen, issues tsunami warnings, and forecasts cyclones.</p>
              </div>
            </div>
          )}
        </div>
      )}
    </aside>
  );
};

export default OceanGuideAgent;
