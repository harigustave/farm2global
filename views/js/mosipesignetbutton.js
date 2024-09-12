const oidcConfig = {
  // authorizeUri: clientDetails.uibaseUrl + clientDetails.authorizeEndpoint,
  // redirect_uri: clientDetails.redirect_uri_userprofile,
  // client_id: clientDetails.clientId,
  // scope: clientDetails.scopeUserProfile,
  // nonce: clientDetails.nonce,
  // state: clientDetails.state,
  // acr_values: clientDetails.acr_values,
  // claims_locales: clientDetails.claims_locales,
  // display: clientDetails.display,
  // prompt: clientDetails.prompt,
  // max_age: clientDetails.max_age,
  // ui_locales: i18n.language,

  acr_values: 'mosip:idp:acr:generated-code mosip:idp:acr:biometrics mosip:idp:acr:static-code',
  authorizeUri: 'https://esignet.dev.mosip.net/authorize',
  claims_locales: 'en',
  client_id: 'i0Ip_Xq4PlpS8wrk0tjjsP_mtmCdp91QSt2CcaoeaVg',
  display: 'page',
  max_age: 21,
  nonce: 'ere973eieljznge2311',
  prompt: 'consent',
  redirect_uri: 'https://healthservices.dev.mosip.net/userprofile',
  scope: 'openid profile',
  state: 'eree2311',
  ui_locales: 'en',
  claims: JSON.parse(decodeURI(clientDetails.userProfileClaims)),
};

window.SignInWithEsignetButton?.init({
  oidcConfig: oidcConfig,
  buttonConfig: {
    labelText: 'Sign in with e-Signet',
    shape: 'soft_edges',
    theme: 'filled_orange',
    type: 'standard'
  },
  signInElement: document.getElementById("sign-in-with-esignet"),
});