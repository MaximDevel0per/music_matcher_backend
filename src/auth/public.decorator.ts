import { SetMetadata } from '@nestjs/common';

/** Markiert eine Route als öffentlich — der globale AuthGuard lässt sie ohne Token durch. */
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
