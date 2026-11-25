import { Icon } from '~/components/icon';
import type { MenuType } from '~/lib/types';
import { cn } from '~/lib/utils';

// The honest image placeholder: a tint of the category hue with a glyph. Never imitates a photo.
export function MenuThumb({
  src,
  type,
  alt,
  className,
  eager,
}: {
  src: string | null | undefined;
  /** Omit when unknown (order history): a neutral placeholder */
  type?: MenuType;
  alt: string;
  className?: string;
  eager?: boolean;
}) {
  const hue =
    type === 'drink'
      ? 'var(--ds-hue-teal)'
      : type === 'food'
        ? 'var(--ds-hue-red)'
        : 'var(--ds-ink-faint)';
  return (
    <div
      className={cn(
        'relative grid aspect-square shrink-0 place-items-center overflow-hidden rounded-lg',
        className,
      )}
      style={{
        color: hue,
        background: `radial-gradient(circle at 70% 30%, color-mix(in srgb, ${hue} 22%, transparent) 0 35%, transparent 36%), color-mix(in srgb, ${hue} 14%, var(--ds-bg-subtle))`,
      }}
    >
      <Icon
        name={
          type === 'drink'
            ? 'daily-needs'
            : type === 'food'
              ? 'dish'
              : 'cutlery-provided'
        }
        className="size-[40%] max-w-12"
      />
      {src && (
        <img
          ref={(el) => {
            if (el?.complete && el.naturalWidth > 0) el.dataset.loaded = '';
          }}
          src={src}
          alt={alt}
          width={224}
          height={224}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          // Fades in over the placeholder once it has loaded
          className="absolute inset-0 size-full object-cover opacity-0 transition-opacity duration-200 ease-out data-loaded:opacity-100"
          onLoad={(e) => (e.currentTarget.dataset.loaded = '')}
          onError={(e) => (e.currentTarget.style.display = 'none')}
        />
      )}
    </div>
  );
}
