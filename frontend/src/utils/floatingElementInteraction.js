export function initFloatingElementInteraction() {
  const handleMouseMove = (e) => {
    // Query elements fresh every time
    const elements = document.querySelectorAll('.floating-element');
    const mouseX = e.clientX;
    const mouseY = e.clientY;
    
    elements.forEach((element) => {
      const rect = element.getBoundingClientRect();
      const elementCenterX = rect.left + rect.width / 2;
      const elementCenterY = rect.top + rect.height / 2;
      
      // Calculate distance from mouse to element
      const distX = mouseX - elementCenterX;
      const distY = mouseY - elementCenterY;
      const distance = Math.sqrt(distX * distX + distY * distY);
      
      // Interaction radius
      const interactionRadius = 150;
      
      if (distance < interactionRadius) {
        // Calculate push direction (away from mouse)
        const angle = Math.atan2(distY, distX);
        const pushDistance = (interactionRadius - distance) * 1.5;
        
        // Apply transform
        const translateX = Math.cos(angle) * pushDistance;
        const translateY = Math.sin(angle) * pushDistance;
        
        element.style.transform = `translate(${translateX}px, ${translateY}px)`;
      } else {
        // Return to original position
        element.style.transform = 'translate(0, 0)';
      }
    });
  };
  
  // Add event listener (only once)
  if (!window.__floatingInteractionAttached) {
    document.addEventListener('mousemove', handleMouseMove);
    window.__floatingInteractionAttached = true;
  }
}
