/*

Copyright 2026 Esri

Licensed under the Apache License Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License. 

*/

/**
 * Creates a fetch proxy that intercepts requests matching URL patterns
 * and applies custom modifications to the response JSON.
 * 
 * @param {Array} handlers - Array of {url, substitutionFn} objects
 * @returns {Proxy} The fetch proxy to be applied to window.fetch
 */
export function createStoryProxy(handlers) {
  const originalFetch = window.fetch;

  const storyFetchProxy = new Proxy(
    originalFetch, 
    {
      apply(target, thisArg, args) {
        const requestUrl = args[0];
        
        if (typeof requestUrl === 'string') {
          // Find matching pattern and its handler
          for (const handler of handlers) {
            if (requestUrl.includes(handler.url)) {
              return originalFetch.apply(thisArg, args).then(async (res) => {
                const originalJson = await res.clone().json();
                const modifiedJson = structuredClone(originalJson);
                
                handler.substitutionFn(modifiedJson);

                return new Response(JSON.stringify(modifiedJson), {
                  status: 200,
                  headers: { 'Content-Type': 'application/json' }
                });
              });
            }
          }
        }

        // No match found, pass through
        return Reflect.apply(target, thisArg, args);
      }
    }
  );

  return storyFetchProxy;
}