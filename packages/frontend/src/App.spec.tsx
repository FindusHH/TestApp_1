//-----------------------------------------------------------------------
// <copyright company="Microsoft Corporation">
//        Copyright (c) Microsoft Corporation.  All rights reserved.
//        Licensed under the MIT license. See LICENSE file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

import type { OpaqueSession } from '@microsoft/rayfin-auth';
import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import App from '@/App';
import { AuthProvider } from '@/hooks/use-auth';
import type { IAuthService } from '@/services/rayfin-auth.service';

const authenticated: OpaqueSession = {
  user: null,
  isAuthenticated: true,
  isAnonymous: false,
};

function authService(): IAuthService {
  return {
    config: { kind: 'ready' },
    canSignIn: true,
    resolveSession: vi.fn(async () => authenticated),
    signIn: vi.fn(async () => authenticated),
    signOut: vi.fn(async () => {}),
  };
}

function renderApp() {
  return render(
    <AuthProvider rayfinAuthService={authService()}>
      <App />
    </AuthProvider>
  );
}

describe('App', () => {
  it('renders without throwing', () => {
    expect(() => renderApp()).not.toThrow();
  });

  it('mounts content into the document', () => {
    renderApp();
    expect(document.body).not.toBeEmptyDOMElement();
  });
});
