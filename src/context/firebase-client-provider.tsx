'use client';

import * as React from 'react';
import { FirebaseProvider, FirebaseProviderProps } from './firebase-provider';

export function FirebaseClientProvider({ children }: FirebaseProviderProps) {
  // We are using this to ensure that we are only rendering the children on the client
  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <React.Fragment>
      {isClient ? <FirebaseProvider>{children}</FirebaseProvider> : null}
    </React.Fragment>
  );
}
