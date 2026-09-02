import { useState } from "react";

/**
 * Картинка контента с запасным вариантом.
 *
 * Библиотека может не загрузить иллюстрацию — или загрузить и потом удалить файл.
 * В обоих случаях панель в зале не должна показывать «сломанную картинку»:
 * вместо неё выводим крупный эмодзи на градиенте карточки.
 */
export function ContentImage({
  src,
  alt,
  fallback,
  className
}: {
  src: string;
  alt: string;
  fallback: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <span className="media-fallback" role="img" aria-label={alt}>
        {fallback}
      </span>
    );
  }

  return <img className={className} src={src} alt={alt} loading="lazy" onError={() => setFailed(true)} />;
}
