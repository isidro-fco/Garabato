import { XIcon } from 'lucide-react'
import { Dialog as DialogPrimitive } from 'radix-ui'
import { Button } from '@/componentes/ui/button'
import { cn } from '@/lib/utils'

function Dialog(props) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />
}

// Ventana flotante centrada. En celular ocupa toda la pantalla. El contenido
// largo hace scroll dentro (el encabezado se queda fijo).
function DialogContent({ className, children, ...props }) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/40 duration-150 supports-backdrop-filter:backdrop-blur-xs data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0" />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        className={cn(
          'fixed inset-0 z-50 flex flex-col bg-background text-sm shadow-xl outline-none duration-150',
          'sm:inset-auto sm:top-1/2 sm:left-1/2 sm:max-h-[calc(100dvh-3rem)] sm:w-[calc(100vw-3rem)] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl sm:border',
          'data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95',
          className,
        )}
        {...props}
      >
        {children}
        <DialogPrimitive.Close asChild>
          <Button variant="ghost" size="icon-sm" className="absolute top-3.5 right-3.5">
            <XIcon />
            <span className="sr-only">Cerrar</span>
          </Button>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  )
}

function DialogHeader({ className, ...props }) {
  return <div className={cn('flex flex-col gap-1 border-b px-4 py-4 pr-14 sm:px-6', className)} {...props} />
}

function DialogBody({ className, ...props }) {
  return <div className={cn('min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6', className)} {...props} />
}

function DialogTitle({ className, ...props }) {
  return <DialogPrimitive.Title className={cn('text-lg font-semibold tracking-tight', className)} {...props} />
}

function DialogDescription({ className, ...props }) {
  return <DialogPrimitive.Description className={cn('text-sm text-muted-foreground', className)} {...props} />
}

export { Dialog, DialogBody, DialogContent, DialogDescription, DialogHeader, DialogTitle }
