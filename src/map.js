export async function initializeMap(mapDiv, latLon) {

  const [Map, MapView, Point, Graphic, SimpleMarkerSymbol] =
    await $arcgis.import([
      "esri/Map",
      "esri/views/MapView",
      "esri/geometry/Point",
      "esri/Graphic",
      "esri/symbols/SimpleMarkerSymbol"
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


}