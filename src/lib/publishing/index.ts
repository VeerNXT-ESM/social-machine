import { PublishingProvider } from './types';
import { MockPublishingProvider } from './mock';
import { ManualPublishingProvider } from './manual';
import { LinkedInProvider } from './linkedin';
import { XProvider } from './x';
import { MetaProvider } from './meta';
import { BufferProvider } from './buffer';
import { Platform } from '@/types';

export function getPublishingProvider(mode: 'mock' | 'manual' | 'buffer' | 'native' = 'mock', platform?: Platform): PublishingProvider {
  if (mode === 'mock') {
    return new MockPublishingProvider();
  }
  if (mode === 'manual') {
    return new ManualPublishingProvider();
  }
  if (mode === 'buffer') {
    return new BufferProvider();
  }
  
  if (mode === 'native') {
    if (platform === 'linkedin') return new LinkedInProvider();
    if (platform === 'x') return new XProvider();
    if (platform === 'facebook' || platform === 'instagram') return new MetaProvider();
  }

  return new MockPublishingProvider();
}

export * from './types';
export * from './mock';
export * from './manual';
export * from './linkedin';
export * from './x';
export * from './meta';
export * from './buffer';
