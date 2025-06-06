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
      center: [105.70009820500417, 21.009999933398163],
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
        tiles: ["http://localhost:8080/data/parking_lots/{z}/{x}/{y}.pbf"], //TODO: Replace with acutual server's API
        minzoom: 6,
        maxzoom: 14,
      });

      mapRef.current.loadImage("/img/sus.png", (error, image) => {
        if (error) throw error;
        if (!mapRef.current.hasImage("icon")) {
          mapRef.current.addImage("icon", image);
        }

        // Add the symbol layer once the image is loaded
        mapRef.current.addLayer({
          id: "points",
          type: "symbol",
          source: "test_layer",
          "source-layer": "test_layer",
          layout: {
            "icon-image": "icon",
            "icon-size": 0.1,
            "icon-anchor": "bottom",
            "icon-allow-overlap": true,
          },
          filter: ["==", "$type", "Point"],
        });
      });

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

    mapRef.current.on("click", "points", function (e) {
      const features = mapRef.current.queryRenderedFeatures(e.point, {
        layers: ["points"],
      });

      if (features.length) {
        const props = features[0].properties;
        console.log(props);

        new mapboxgl.Popup()
          .setLngLat(e.lngLat)
          .setHTML(
            `
            <div style="color: #333; font-family: sans-serif; font-size: 14px;">
            <strong style="color: #2c7;">Name: ${props.Name}</strong><br/>
            <span style="color: #555;">Description: ${props.Description}</span>
            </div>
            `
          )
          .addTo(mapRef.current);
      }
    });

    mapRef.current.on("mouseenter", "points", () => {
      mapRef.current.getCanvas().style.cursor = "pointer";
    });

    mapRef.current.on("mouseleave", "points", () => {
      mapRef.current.getCanvas().style.cursor = "";
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
