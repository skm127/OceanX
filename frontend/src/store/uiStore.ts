import { create } from 'zustand';

export type ProductMode = 'research' | 'sounding' | 'datamanager' | 'learn';
export type ExplainMode = 'citizen' | 'scientist';

interface UIState {
  // Global product mode
  productMode: ProductMode;
  setProductMode: (mode: ProductMode) => void;
  
  // Explainability
  explainMode: ExplainMode;
  setExplainMode: (mode: ExplainMode) => void;

  // Modals visibility
  briefingOpen: boolean;
  setBriefingOpen: (open: boolean) => void;
  
  provenanceOpen: boolean;
  setProvenanceOpen: (open: boolean) => void;
  
  coLocationOpen: boolean;
  setCoLocationOpen: (open: boolean) => void;
  
  transectModalOpen: boolean;
  setTransectModalOpen: (open: boolean) => void;
  
  searchModalOpen: boolean;
  setSearchModalOpen: (open: boolean) => void;
  
  realtimeModalOpen: boolean;
  setRealtimeModalOpen: (open: boolean) => void;
  
  guideOpen: boolean;
  setGuideOpen: (open: boolean | ((prev: boolean) => boolean)) => void;

  toolsMenuOpen: boolean;
  setToolsMenuOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  productMode: 'research',
  setProductMode: (mode) => set({ productMode: mode }),

  explainMode: 'citizen',
  setExplainMode: (mode) => set({ explainMode: mode }),

  briefingOpen: false,
  setBriefingOpen: (open) => set({ briefingOpen: open }),

  provenanceOpen: false,
  setProvenanceOpen: (open) => set({ provenanceOpen: open }),

  coLocationOpen: false,
  setCoLocationOpen: (open) => set({ coLocationOpen: open }),

  transectModalOpen: false,
  setTransectModalOpen: (open) => set({ transectModalOpen: open }),

  searchModalOpen: false,
  setSearchModalOpen: (open) => set({ searchModalOpen: open }),

  realtimeModalOpen: false,
  setRealtimeModalOpen: (open) => set({ realtimeModalOpen: open }),

  guideOpen: false,
  setGuideOpen: (updater) => set((state) => ({ 
    guideOpen: typeof updater === 'function' ? updater(state.guideOpen) : updater 
  })),

  toolsMenuOpen: false,
  setToolsMenuOpen: (open) => set({ toolsMenuOpen: open }),
}));
