import { Toaster as Sonner, type ToasterProps } from "sonner"
import { Icon } from "~/components/icon"
import { useMode } from "~/lib/theme"
import { Spinner } from "~/components/ui/spinner";

// Floating flag: 1rem corners, high shadow, an icon with every status
const Toaster = (props: ToasterProps) => {
  const mode = useMode()
  return (
    <Sonner
      theme={mode}
      position="top-center"
      className="toaster group"
      icons={{
        success: <Icon name="correct" className="size-5 text-success-ink" />,
        info: <Icon name="info" className="size-5 text-info-ink" />,
        warning: <Icon name="error" className="size-5 text-warning-ink" />,
        error: <Icon name="error" className="size-5 text-danger-ink" />,
        loading: <Spinner label={false} />,
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "transparent",
          "--border-radius": "var(--ds-radius-feedback)",
        } as React.CSSProperties
      }
      toastOptions={{ classNames: { toast: "shadow-ds-3! type-body-s! dark:border-border!", title: "type-label-s!" } }}
      {...props}
    />
  )
}

export { Toaster }
