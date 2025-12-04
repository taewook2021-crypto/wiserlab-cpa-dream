import { useState } from "react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  containerClassName?: string;
  priority?: boolean;
  aspectRatio?: "square" | "video" | "auto";
}

const OptimizedImage = ({
  src,
  alt,
  className,
  containerClassName,
  priority = false,
  aspectRatio = "auto",
}: OptimizedImageProps) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  const aspectClasses = {
    square: "aspect-square",
    video: "aspect-video",
    auto: "",
  };

  return (
    <div className={cn("relative overflow-hidden", aspectClasses[aspectRatio], containerClassName)}>
      {!loaded && !error && (
        <Skeleton className="absolute inset-0 w-full h-full" />
      )}
      <img
        src={src}
        alt={alt}
        loading={priority ? "eager" : "lazy"}
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
        className={cn(
          "transition-opacity duration-300",
          loaded ? "opacity-100" : "opacity-0",
          className
        )}
      />
    </div>
  );
};

export default OptimizedImage;
