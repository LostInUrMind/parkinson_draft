import React, { useEffect, useRef } from "react";
import mapboxgl, { Marker } from "mapbox-gl";

import "mapbox-gl/dist/mapbox-gl.css";

const MapboxExample = () => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const geolocateRef = useRef(null);
  let userCoords = null;
  let pinCoords = null;

  useEffect(() => {
    mapboxgl.accessToken =
      "pk.eyJ1IjoibmhhdG5tMTIzIiwiYSI6ImNtODJkdzdrYjBiZzEya3NhZXBvNzV4eWYifQ.T-cwvyhjH_EdZ-c6tKYRaQ"; //TODO: Move this to somewhere else

    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/nhatnm123/cm7n5ry8s00xy01r3g2azhk07",
      center: [105.83, 21.02],
      zoom: 15,
    });

    geolocateRef.current = new mapboxgl.GeolocateControl({
      positionOptions: {
        enableHighAccuracy: true,
      },
      trackUserLocation: true,
      showUserHeading: true,
    });

    mapRef.current.addControl(geolocateRef.current);

    mapRef.current.on("load", () => {
      mapRef.current.addSource("test_layer", {
        type: "vector",
        tiles: ["http://localhost:8080/data/point_data/{z}/{x}/{y}.pbf"], //TODO: Replace with acutual server's API
        minzoom: 6,
        maxzoom: 14,
      });

      mapRef.current.addLayer({
        id: "test-layer-fill",
        type: "fill",
        source: "test_layer",
        "source-layer": "test_layer",
        paint: {
          "fill-color": "#ff0000",
          "fill-opacity": 0.5,
        },
      });

      mapRef.current.loadImage(
        "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/RedDot.svg/1024px-RedDot.svg.png",
        (error, image) => {
          if (error) throw error;
          if (!mapRef.current.hasImage("teardrop")) {
            mapRef.current.addImage("teardrop", image);
          }

          // Add the symbol layer once the image is loaded
          mapRef.current.addLayer({
            id: "points-teardrop",
            type: "symbol",
            source: "test_layer",
            "source-layer": "test_layer",
            layout: {
              "icon-image": "teardrop",
              "icon-size": 0.05, // adjust based on image size
              "icon-anchor": "bottom",
            },
            filter: ["==", "$type", "Point"],
          });
        }
      );

      // mapRef.current.addLayer({
      //   id: "points-circle",
      //   type: "circle",
      //   source: "test_layer",
      //   "source-layer": "test_layer",
      //   paint: {
      //     "circle-radius": 16,
      //     "circle-color": "#0078d4",
      //   },
      //   filter: ["==", "$type", "Point"],
      // });

      geolocateRef.current.trigger();
    });

    mapRef.current.on("click", (event) => {
      const { lng, lat } = event.lngLat;
      console.log("User clicked at:", { longitude: lng, latitude: lat });
      pinCoords = [lng, lat];
      if (userCoords) {
        getRoute(userCoords, pinCoords, mapboxgl.accessToken);
      }
    });

    geolocateRef.current.on("geolocate", (position) => {
      userCoords = [
        position.coords.longitude,
        position.coords.latitude,
        position.coords.accuracy,
      ];
      console.log("User location:", {
        longitude: userCoords[0],
        latitude: userCoords[1],
        accuracy: userCoords[2],
      });
    });

    /**
     * Draw the path to the selected location
     * @param {*} userCoords current user's location
     * @param {*} pinCoords selected location
     * @param {*} access_token access token to the map
     */
    async function getRoute(userCoords, pinCoords, access_token) {
      const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${userCoords[0]},${userCoords[1]};${pinCoords[0]},${pinCoords[1]}?geometries=geojson&access_token=${access_token}`;

      const response = await fetch(url);
      const data = await response.json();

      const route = data.routes[0].geometry;

      // Add route to the map
      if (mapRef.current.getSource("route")) {
        mapRef.current.getSource("route").setData({
          type: "Feature",
          geometry: route,
        });
      } else {
        mapRef.current.addSource("route", {
          type: "geojson",
          data: {
            type: "Feature",
            geometry: route,
          },
        });

        mapRef.current.addLayer({
          id: "route-line",
          type: "line",
          source: "route",
          layout: {
            "line-join": "round",
            "line-cap": "round",
          },
          paint: {
            "line-color": "#3887be",
            "line-width": 5,
            "line-opacity": 0.75,
          },
        });
      }
    }

    return () => {
      mapRef.current.remove();
    };
  }, []);

  return (
    <div
      ref={mapContainerRef}
      style={{ height: "100vh", width: "100vw" }}
    ></div>
  );
};

export default MapboxExample;
