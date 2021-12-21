function supportsWebGl()
{
    // from https://github.com/Modernizr/Modernizr/blob/master/feature-detects/webgl.js
    const canvas = document.createElement('canvas'),
        supports = 'probablySupportsContext' in canvas ? 'probablySupportsContext' : 'supportsContext';
    if (supports in canvas)
    {
        return canvas[supports]('webgl') || canvas[supports]('experimental-webgl');
    }
    return 'WebGLRenderingContext' in window;
}

export {
    supportsWebGl,
}