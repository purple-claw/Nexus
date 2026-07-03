/// <reference types="vite/client" />

declare module '*.css' {
  const content: string
  export default content
}

declare module 'react-syntax-highlighter' {
  const content: any
  export default content
}

declare module 'react-syntax-highlighter/dist/esm/styles/prism' {
  const content: any
  export default content
}

declare module 'framer-motion' {
  import { ComponentType } from 'react'

  export interface MotionProps {
    initial?: any
    animate?: any
    exit?: any
    transition?: any
    variants?: any
    layoutId?: string
    whileHover?: any
    whileTap?: any
    whileFocus?: any
    whileDrag?: any
    whileInView?: any
    layout?: boolean | 'position' | 'size' | 'preserve-aspect'
    style?: any
  }

  export const motion: {
    div: ComponentType<CustomDOMProps<JSX.IntrinsicElements['div']>>
    span: ComponentType<CustomDOMProps<JSX.IntrinsicElements['span']>>
    button: ComponentType<CustomDOMProps<JSX.IntrinsicElements['button']>>
    a: ComponentType<CustomDOMProps<JSX.IntrinsicElements['a']>>
    aside: ComponentType<CustomDOMProps<JSX.IntrinsicElements['aside']>>
    p: ComponentType<CustomDOMProps<JSX.IntrinsicElements['p']>>
    h1: ComponentType<CustomDOMProps<JSX.IntrinsicElements['h1']>>
    h2: ComponentType<CustomDOMProps<JSX.IntrinsicElements['h2']>>
    h3: ComponentType<CustomDOMProps<JSX.IntrinsicElements['h3']>>
    img: ComponentType<CustomDOMProps<JSX.IntrinsicElements['img']>>
    section: ComponentType<CustomDOMProps<JSX.IntrinsicElements['section']>>
    header: ComponentType<CustomDOMProps<JSX.IntrinsicElements['header']>>
    nav: ComponentType<CustomDOMProps<JSX.IntrinsicElements['nav']>>
    ul: ComponentType<CustomDOMProps<JSX.IntrinsicElements['ul']>>
    li: ComponentType<CustomDOMProps<JSX.IntrinsicElements['li']>>
  }

  export { AnimatePresence, AnimatePresenceProps }
  export const AnimatePresence: ComponentType<{ initial?: boolean; mode?: 'wait' | 'sync' | 'popLayout'; children?: any }>
}

declare module 'react-markdown' {
  import { ComponentType } from 'react'
  const ReactMarkdown: ComponentType<{ children?: any; remarkPlugins?: any[]; rehypePlugins?: any[]; components?: any; className?: string }>
  export default ReactMarkdown
}

declare module 'remark-gfm' {
  const remarkGfm: any
  export default remarkGfm
}

declare module 'remark-math' {
  const remarkMath: any
  export default remarkMath
}
