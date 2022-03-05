import logo from './logo.svg';
import './App.css';
import { useState, useEffect, useRef } from 'react';
import Globe from 'react-globe.gl'
import * as d3 from 'd3'
import indexBy from "index-array-by";
import rawData from "./data/universities.csv"
import geoUniversity from "./data/geoUniversity.csv"
import SpaceDust from "./Components/SpaceDust"

// [{ lat: 19.6, lng: 80, altitude: 0.6 },{ lat: 50, lng: 60, altitude: 0.4 },{ lat: 31.3037101, lng: -89.29276214, altitude: 0.4 },{ lat: 33.5842591, lng: -101.8804709, altitude: 0.6 }]
const MAP_CENTERs = [{ lat: 19.6, lng: 80, altitude: 0.6 },{ lat: 50, lng: 60, altitude: 0.4 },{ lat: 31.3037101, lng: -89.29276214, altitude: 0.4 },{ lat: 33.5842591, lng: -101.8804709, altitude: 0.6 }];
// const MAP_CENTER = { lat: 33.5842591, lng: -101.8804709, altitude: 0.6 };
const OPACITY = 0.3;
const RING_PROPAGATION_SPEED = 1; // deg/sec

const arcThickScale = d3.scaleLinear().range([0.05,1]);
function App() {
    const globeEl = useRef();
    const [locs, setLocs] = useState([]);
    const [routes, setRoutes] = useState([]);
    const [hoverArc, setHoverArc] = useState();

    useEffect(() => {
        // load data
        Promise.all([
            d3.csv(rawData),
            d3.csv(geoUniversity)
        ]).then(([studentData,locationData]) => {
            const groupByLocation = d3.groups(studentData,d=>d["Location Name"]);
            arcThickScale.domain(d3.extent(groupByLocation,d=>d[1].length));
            // route
            const byLocName = indexBy(locationData, 'Location Name', false);

            const filteredRoutes = groupByLocation
                .map(d => ({
                    name: d[0],
                    srcIata: d[0],
                    src: byLocName[d[0]],
                    dstIata: d[1][0]["Current Location"],
                    dst: byLocName[d[1][0]["Current Location"]],
                    data: d[1]
                })); // domestic routes within country
            const locs = groupByLocation.map(d=>{
                return {...byLocName[d[0]], count:d[1].length,values:d[1]}
            })
            setLocs(locs);
            setRoutes(filteredRoutes);


            MAP_CENTERs.forEach(d=>globeEl.current.pointOfView(d, 4000))
        });
    }, []);

    return  <div
        className="App"
        style={{
            background: "#000010",
            position: "relative"
        }}
    >
        <Globe
        ref={globeEl}
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"


        arcsData={routes}
        arcLabel={d => `${d.name}: ${d.srcIata} &#8594; ${d.dstIata}`}
        arcStartLat={d => +d.src.lat}
        arcStartLng={d => +d.src.long}
        arcEndLat={d => +d.dst.lat}
        arcEndLng={d => +d.dst.long}
        arcDashLength={0.4}
        arcDashGap={0.8}
        arcDashAnimateTime={d=>5000}
        arcsTransitionDuration={1000}
        arcStroke={d=>Math.sqrt(arcThickScale(d.data.length))}
        arcColor={d => {
            const op = !hoverArc ? OPACITY : d === hoverArc ? 0.9 : OPACITY / 4;
            return [`rgba(0, 255, 0, ${op})`, `rgba(255, 0, 0, ${op})`];
        }}
        onArcHover={setHoverArc}

        pointsData={locs}
        pointColor={() => 'orange'}
        pointLat={d => d.lat}
        pointLng={d => d.long}
        pointAltitude={0}
        pointRadius={d => arcThickScale(d.count)}
        pointsMerge={true}

        // labelsData={locs}
        // labelLat={d => d.lat}
        // labelLng={d => d.long}
        // labelText={d => d['Location Name']}
        // labelSize={d => arcThickScale(d.count)}
        // labelDotRadius={d => arcThickScale(d.count)}
        // labelColor={() => 'rgba(255, 165, 0, 0.75)'}
        // labelResolution={2}

        ringsData={locs}
        ringLat={d => d.lat}
        ringLng={d => d.long}
        ringColor={() => t => `rgba(255,100,50,${1-t})`}
        ringMaxRadius={d=>arcThickScale(d.count)*5}
        ringPropagationSpeed={d=>arcThickScale(d.count)*RING_PROPAGATION_SPEED}
        // ringRepeatPeriod={d=>arcThickScale(d.count) }
    />
        <div
            style={{
                position: "absolute",
                bottom: 0,
                right: 0,
                padding: "80px",
                fontSize: "70px",
                color: "#fff",
                display: "flex",
                "align-items": "center"
            }}
        >
            Where are you from?
        </div>
    </div>;
}

export default App;
