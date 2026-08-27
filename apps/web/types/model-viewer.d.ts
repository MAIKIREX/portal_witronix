import type { DetailedHTMLProps, HTMLAttributes } from "react";

/**
 * `<model-viewer>` es un web component (custom element) de @google/model-viewer,
 * no un componente React, asi que TypeScript no conoce sus atributos hasta que
 * se declaran aqui. Solo se tipan los atributos que usamos.
 *
 * Con el runtime "react-jsx" (React 19), los elementos intrinsecos se
 * resuelven desde `React.JSX.IntrinsicElements`, no desde el namespace global
 * `JSX`: aumentar el global no tiene efecto aqui, hay que aumentar el modulo
 * "react".
 */
type ModelViewerAttributes = DetailedHTMLProps<
  HTMLAttributes<HTMLElement>,
  HTMLElement
> & {
  src?: string;
  alt?: string;
  poster?: string;
  ar?: boolean;
  "camera-controls"?: boolean;
  "auto-rotate"?: boolean;
  "shadow-intensity"?: string;
  exposure?: string;
  loading?: "auto" | "lazy" | "eager";
  reveal?: "auto" | "interaction" | "manual";
};

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "model-viewer": ModelViewerAttributes;
    }
  }
}

export {};
