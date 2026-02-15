import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { useEffect, useState } from "react";
import io from "socket.io-client";

const socket = io("http://localhost:5000");

export default function MapView(){

  const [position,setPosition]=useState([20.5937,78.9629]);
  const [vehicle,setVehicle]=useState("");

  useEffect(()=>{

    const id = prompt("Enter Vehicle Number to Track");

    setVehicle(id);

    socket.emit("join-trip",id);

    socket.on("receive-location",(data)=>{
      setPosition([data.lat,data.lng]);
    });

  },[]);

  return(
    <MapContainer center={position} zoom={15} style={{height:"100vh"}}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/>
      <Marker position={position}>
        <Popup>{vehicle} Live Location</Popup>
      </Marker>
    </MapContainer>
  );
}