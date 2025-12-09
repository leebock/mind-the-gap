export async function initializeMap(mapDiv, latLon, tractFeature, tractServiceUrl) {

  const [Map, MapView, Point, Graphic, SimpleMarkerSymbol, FeatureLayer] =
    await $arcgis.import([
      "esri/Map",
      "esri/views/MapView",
      "esri/geometry/Point",
      "esri/Graphic",
      "esri/symbols/SimpleMarkerSymbol",
      "esri/layers/FeatureLayer"
    ]);

  const map = new Map({
    basemap: "streets-navigation-vector"
  });

  // Create the map view
  const view = new MapView({
    container: mapDiv,
    map: map,
    center: [latLon[1], latLon[0]], // [longitude, latitude]
    zoom: 12
  });
  console.log("Created map view:", view);

  // Wait for the view to be ready
  await view.when();
  console.log("Map view is ready!");

  // Add location marker
  const locationPoint = new Point({
    longitude: latLon[1],
    latitude: latLon[0]
  });

  const markerSymbol = new SimpleMarkerSymbol({
    color: [226, 119, 40], // Orange
    size: 12,
    outline: {
      color: [255, 255, 255],
      width: 2
    }
  });

  const locationGraphic = new Graphic({
    geometry: locationPoint,
    symbol: markerSymbol
  });

  view.graphics.add(locationGraphic);
  console.log("Added location marker to map.");

  // Add tract boundary as FeatureLayer (only if we have tract data)
  if (tractFeature && tractFeature.attributes && tractFeature.attributes.GEOID) {
    const tractLayer = new FeatureLayer({
      url: tractServiceUrl,
      outFields: ["*"],
      definitionExpression: `GEOID = '${tractFeature.attributes.GEOID}'`, // Filter to just this tract
      renderer: {
        type: "simple",
        symbol: {
          type: "simple-fill",
          color: [255, 0, 0, 0.3], // Semi-transparent red
          outline: {
            color: [255, 0, 0],
            width: 2
          }
        }
      }
    });
    
    map.add(tractLayer);
    console.log("Added tract layer");

    // Wait for tract layer to load and zoom to its extent
    await tractLayer.when();
    console.log("Tract layer loaded");
    
    // Query the layer to get the extent of the filtered tract
    const query = tractLayer.createQuery();
    const result = await tractLayer.queryExtent(query);
    
    if (result.extent) {
      console.log("Zooming to tract extent:", result.extent);
      await view.goTo(result.extent.expand(1.2)); // Add some padding
    }

  }


}