
import './App.css';
import React, {useState, useEffect, useRef, useMemo} from 'react';
import Globe from 'react-globe.gl'
import * as d3 from 'd3'
import indexBy from "index-array-by";
import rawData from "./data/universities.csv"
import geoUniversity from "./data/geoUniversity.csv"
import ttulogo from "./ttu.png"
import SpaceDust from "./Components/SpaceDust"

// [{ lat: 19.6, lng: 80, altitude: 0.6 },{ lat: 50, lng: 60, altitude: 0.4 },{ lat: 31.3037101, lng: -89.29276214, altitude: 0.4 },{ lat: 33.5842591, lng: -101.8804709, altitude: 0.6 }]
const MAP_CENTERs = [{ lat: 19.6, lng: 80, altitude: 0.6 },{ lat: 51.58421865, lng: 45.9571029, altitude: 0.4 },{ lat: 31.3037101, lng: -89.29276214, altitude: 0.4 },{ lat: 33.5842591, lng: -101.8804709, altitude: 0.6 }];
// const MAP_CENTER = { lat: 33.5842591, lng: -101.8804709, altitude: 0.6 };
const OPACITY = 0.3;
const RING_PROPAGATION_SPEED = 1; // deg/sec

const arcThickScale = d3.scaleLinear().range([0.1,0.7]);
function App() {
    const globeEl = useRef();
    const [logos, setLogos] = useState([]);
    const [locs, setLocs] = useState([]);
    const [routes, setRoutes] = useState([]);
    const [hoverArc, setHoverArc] = useState();
    const [selectPoint, setSelectPoint] = useState();
    const [currentSequnce,setCurrentSequnce] = useState(0);

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
                return {...byLocName[d[0]],"Location Name":d[0], count:d[1].length,values:d[1]}
            })
            locs.sort((a,b)=>b.count-a.count)
            locs.push({...byLocName["Texas Tech University"],"Location Name":"Texas Tech University",count:d3.max(groupByLocation,d=>d[1].length),color:"red"});
            setLocs(locs);
            setRoutes(filteredRoutes);
            setLogos([byLocName["Texas Tech University"]]);
            globeEl.current.pointOfView(MAP_CENTERs[0], 4000)
            // MAP_CENTERs.forEach(d=>globeEl.current.pointOfView(d, 4000))
        });
    }, []);

    useEffect(()=>{
        if (globeEl.current) {
            if (currentSequnce < MAP_CENTERs.length) {
                const interval = setTimeout(() => {
                    globeEl.current.pointOfView(MAP_CENTERs[currentSequnce], 4000)
                    setCurrentSequnce(currentSequnce + 1);
                }, 4000);
                return () => {
                    clearInterval(interval);
                };
            }
        }
    },[currentSequnce])
    function stopPlay(){
        setCurrentSequnce(5)
    }
    return  <div
        className="App"
        style={{
            background: "#000010",
            position: "relative"
        }}
    >
        <div style={{
            transform: "translate(-20%, 0)",
            width: '130wh'
        }}>
            <Globe
            ref={globeEl}
            globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"


            arcsData={routes}
            arcLabel={d => `${d.name}`}
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
            // onArcHover={setHoverArc}

            // pointsData={locs}
            // pointColor={d => d.color??'orange'}
            // pointLat={d => d.lat}
            // pointLng={d => d.long}
            // pointAltitude={0}
            // pointRadius={d => arcThickScale(d.count)}
            // pointsMerge={true}

            labelsData={locs}
            labelLat={d => d.lat}
            labelLng={d => d.long}
            labelAltitude={d=>(selectPoint&&(selectPoint===d))?0.01:0}
            labelText={d => d['Location Name']}
            labelSize={d => (selectPoint&&(selectPoint===d))?0.8:arcThickScale(d.count)/3}
            labelDotRadius={d => arcThickScale(d.count)}
            labelColor={d => (selectPoint&&(selectPoint===d))?('#dd6700'):(d.color??'orange')}
            labelResolution={2}

            ringsData={[locs[locs.length-1]]}
            ringLat={d => d.lat}
            ringLng={d => d.long}
            ringColor={() => t => `rgba(255,100,50,${1-t})`}
            ringMaxRadius={d=>arcThickScale(d.count)*5}
            ringPropagationSpeed={d=>arcThickScale(d.count)*RING_PROPAGATION_SPEED}
            // ringRepeatPeriod={d=>arcThickScale(d.count) }
            htmlElementsData={logos}
            htmlLat={d => d.lat}
            htmlLng={d => d.long}
            // htmlElement={<img src={ttulogo} width={"50px"} alt="Logo" />}
            htmlElement={<h1>We are here</h1>}
            onGlobeClick={stopPlay}
            />
        </div>
        <div
            style={{
                position: "absolute",
                bottom: 0,
                right: 0,
                padding: "80px",
                display: "flex",
                alignItems: "center",
                flexDirection: "column"
            }}
        >
            <div style={{
                display: "flex",
                alignItems: "right",
                color: "#fff",
                flexDirection: "column",
                height:'calc(100vh - 300px)',
                width:'100%',
                padding:'10px',
                position:'relative',
                overflowY:'auto',
                overflowX: 'hidden',
                background: '#ffffff0d',
                borderRadius:'5px',
                marginBottom:'10px',
                fontSize:'small',
            }} className="sc1">
                {locs.slice(0,locs.length-1).map(d=><div key={d['Location Name']} style={{width:'100%', padding: '1px', display: "flex"}}
                                                         onMouseEnter={()=>{setSelectPoint(d)}}
                                                         onMouseLeave={()=>{setSelectPoint(undefined)}}
                                                         onClick={()=>{stopPlay(); globeEl.current.pointOfView({lat:d.lat,lng:d.long+8,altitude:0.4}, 1000)}}
                >
                    <div style={{width:'30%', textAlign:"right",padding:'2px',textOverflow: "ellipsis",whiteSpace: "nowrap",overflow: "hidden"}}>{d['Location Name']}</div>
                    <div style={{width:'70%',height:'100%',background:'black',position:'relative',borderRadius:'10px'}}>
                        <div style={{width:`${(d.count/arcThickScale.domain()[1])*100}%`,height:'100%',background:(selectPoint&&(selectPoint===d))?'#dd6700':'orange',position:'absolute',borderRadius:'10px'}}>
                            <span>{d.count}</span>
                        </div>
                    </div>
                </div>)}
            </div>
            <div style={{
                display: "flex",
                alignItems: "center",
                fontSize: "60px",
                color: "#fff",
            }}
                 onClick={()=>{setCurrentSequnce(0)}}
            >
            Where are you from? <img src={ttulogo} width={"50px"} alt="Logo" />
            </div>
        </div>
    </div>;
}

export default App;
