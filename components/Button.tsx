import clsx from 'clsx';
import { ActivityIndicator, PressableProps } from 'react-native';
import { PressableAnimated } from './pressable-animated';

interface Props extends PressableProps {
  children: React.ReactNode;
  loaderSize?: number;
  loading?: boolean;
  className?: PressableProps["className"];
  scale?: number;
  background?: string;
}

/**
 * 
 * @param children Button children
 * @param loaderSize ActivityIndicator size
 * @default 20
 * 
 * @param loading Whether the button is loading
 * @default false
 * 
 * @param className Button className
 * @default ""
 * 
 * @param scale Button scale
 * @default 1
 * 
 * @param background Button background
 * @default "bg-emerald-500"
 * 
 * @returns Button component
 */

export const Button = ({ children, loaderSize = 20, loading = false, className = "", scale = 1, background = "bg-emerald-500", ...rest }: Props) => {
  return (
    <PressableAnimated
      {...rest}
      scale={scale}
      disabled={loading}
      className={clsx(
        'flex flex-row items-center justify-center gap-3 rounded-xl p-2',
        loading && "opacity-70 pointer-events-none",
        background,
        className,
      )}>
      {!loading && (
        children
      )}
      {loading && (
        <ActivityIndicator
          size={loaderSize}
          color="black"
        />
      )}
    </PressableAnimated>
  );
};
