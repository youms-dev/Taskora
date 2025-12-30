import clsx from 'clsx';
import { ActivityIndicator, PressableProps } from 'react-native';
import { PressableAnimated } from './pressable';

interface Props extends PressableProps {
  children: React.ReactNode;
  loaderSize?: number;
  loading?: boolean;
  className?: PressableProps["className"];
  scale?: number;
  background?: string;
}

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
