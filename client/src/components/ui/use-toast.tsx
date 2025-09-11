import * as React from "react";

type ToastVariant = "default" | "destructive";

export type ToastActionElement = React.ReactNode;

export type ToastProps = {
  id?: string;
  title?: string;
  description?: string;
  action?: ToastActionElement;
  variant?: ToastVariant;
  duration?: number; // ms
};

type ToasterToast = ToastProps & { id: string; open: boolean };

type ToastState = {
  toasts: ToasterToast[];
};

const TOAST_REMOVE_DELAY = 300; // ms para animación de salida

// -------------------------------
// Store (sin dependencias externas)
// -------------------------------
let count = 0;
function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER;
  return `toast_${Date.now()}_${count}`;
}

type ToastAction =
  | { type: "ADD_TOAST"; toast: ToasterToast }
  | { type: "UPDATE_TOAST"; toast: Partial<ToasterToast> & { id: string } }
  | { type: "DISMISS_TOAST"; toastId?: string }
  | { type: "REMOVE_TOAST"; toastId?: string };

const listeners = new Set<(state: ToastState) => void>();

let memoryState: ToastState = { toasts: [] };

function dispatch(action: ToastAction) {
  switch (action.type) {
    case "ADD_TOAST": {
      memoryState = {
        ...memoryState,
        toasts: [action.toast, ...memoryState.toasts],
      };
      break;
    }
    case "UPDATE_TOAST": {
      memoryState = {
        ...memoryState,
        toasts: memoryState.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      };
      break;
    }
    case "DISMISS_TOAST": {
      const id = action.toastId;
      memoryState = {
        ...memoryState,
        toasts: memoryState.toasts.map((t) =>
          !id || t.id === id ? { ...t, open: false } : t
        ),
      };
      break;
    }
    case "REMOVE_TOAST": {
      const id = action.toastId;
      memoryState = {
        ...memoryState,
        toasts: id
          ? memoryState.toasts.filter((t) => t.id !== id)
          : [],
      };
      break;
    }
  }
  listeners.forEach((l) => l(memoryState));
}

function addToast(props: ToastProps) {
  const id = props.id ?? genId();
  const toast: ToasterToast = {
    id,
    open: true,
    ...props,
  };
  dispatch({ type: "ADD_TOAST", toast });

  const duration = typeof props.duration === "number" ? props.duration : 2600;
  window.setTimeout(() => dismiss(id), duration);
  return id;
}

function updateToast(toast: ToastAction["toast"]) {
  dispatch({ type: "UPDATE_TOAST", toast });
}

function dismiss(toastId?: string) {
  dispatch({ type: "DISMISS_TOAST", toastId });

  // elimina tras animación
  window.setTimeout(() => {
    dispatch({ type: "REMOVE_TOAST", toastId });
  }, TOAST_REMOVE_DELAY);
}

function useStore(): ToastState {
  const [state, setState] = React.useState<ToastState>(memoryState);
  React.useEffect(() => {
    listeners.add(setState);
    return () => {
      listeners.delete(setState);
    };
  }, []);
  return state;
}

// -------------------------------
// Hook + helpers exportados
// -------------------------------
export function useToast() {
  const state = useStore();

  return {
    ...state,
    toast: (props: ToastProps) => addToast(props),
    dismiss,
    // opcional: actualizar/forzar cierre por id
    update: updateToast,
    remove: (id?: string) => dispatch({ type: "REMOVE_TOAST", toastId: id }),
  };
}

// También exporto un atajo por si prefieres:
// import { toast } from "@/components/ui/use-toast"
export const toast = (props: ToastProps) => addToast(props);
export const dismissToast = (id?: string) => dismiss(id);
