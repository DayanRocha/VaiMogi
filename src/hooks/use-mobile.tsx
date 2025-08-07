import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean>(() => {
    // Inicialização imediata para evitar undefined
    if (typeof window !== 'undefined') {
      return window.innerWidth < MOBILE_BREAKPOINT;
    }
    return false; // Fallback para SSR
  });

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      const newIsMobile = window.innerWidth < MOBILE_BREAKPOINT;
      console.log('📱 Mobile detection changed:', newIsMobile);
      setIsMobile(newIsMobile);
    }
    mql.addEventListener("change", onChange)
    // Garantir que o estado inicial está correto
    const initialIsMobile = window.innerWidth < MOBILE_BREAKPOINT;
    setIsMobile(initialIsMobile);
    console.log('📱 Initial mobile detection:', initialIsMobile);
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return isMobile
}
