import React, { useState, useLayoutEffect, useRef } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Object3D, Color, MOUSE, DoubleSide } from 'three';
import { useSpring } from '@react-spring/three';
import { select } from 'd3-selection';
import { data } from './data';
const n = data['isoGroup'].length;

console.log(Object.keys(data));

function valueCounts(col) {
  const occurrences = data[col].reduce(function (acc, curr) {
    return acc[curr] ? ++acc[curr] : acc[curr] = 1, acc
  }, {});
  return occurrences
}

/*groupMaps----------------------------------------------------------------------*/

function makeMap(groupArray,glyphGroup) {
  const groupMap = {};
  groupArray.forEach((item, i) => {
    const globalIndexArray = [];
    data[glyphGroup].forEach((groupValue, j) => {
      if ( groupValue === item ) {
        globalIndexArray.push(j)
      }
    });
    groupMap[item] = globalIndexArray;
  });
  return groupMap
}

data['boxGroup'] = Array(n).fill('b');
const boxGroupArray = ['b'];
const boxMap = makeMap(boxGroupArray,'boxGroup');

const expressivenessGroupArray = Array.from(new Set(data['expressivenessGroup']));
const expressivenessMap = makeMap(expressivenessGroupArray,'expressivenessGroup');

const isoGroupArray = Array.from(new Set(data['isoGroup']));
const isoMap = makeMap(isoGroupArray,'isoGroup');
const zArray = isoGroupArray.map(d => d.split('_')[0]==='0' ? 0.05 : d.split('_')[0]==='1' ? 0.25 : d.split('_')[0]==='2' ? 0.5 : 0.75);

const radarGroupArray = Array.from(new Set(data['radarGroup']));
const radarMap = makeMap(radarGroupArray,'radarGroup');

const axisNotch = (binNumber, numBins) => {
  if ( numBins === 3 ) {
    return binNumber === '0' ? 0.33/2 : binNumber === '1' ? 0.66/2 : 0.99/2
  } else if ( numBins === 4 ) {
    return binNumber === '0' ? 0.25/2 : binNumber === '1' ? 0.5/2 : binNumber === '2' ? 0.75/2 : 1.0/2
  }
}

function radarVertices(glyphGroup) {
  let [thick, rough, gloss, color] = glyphGroup.split('_');

  thick = axisNotch(thick, 4) * -1;
  rough = axisNotch(rough, 3) * -1;
  gloss = axisNotch(gloss, 3);
  color = axisNotch(color, 4);

  const glyphThickness = 0.1;

  const thicktop = [thick,0,glyphThickness];
  const thickbottom = [thick,0,0];
  const roughtop = [0,rough,glyphThickness];
  const roughbottom = [0,rough,0];
  const glosstop = [gloss,0,glyphThickness];
  const glossbottom = [gloss,0,0];
  const colortop = [0,color,glyphThickness];
  const colorbottom = [0,color,0];

  const bottom = [thickbottom, glossbottom, colorbottom, roughbottom, glossbottom, thickbottom];
  const top = [thicktop, glosstop, colortop, roughtop, glosstop, thicktop];
  const upperLeft = [colorbottom, thicktop, colortop, colorbottom, thickbottom, thicktop];
  const upperRight = [glossbottom, colortop, glosstop, glossbottom, colorbottom, colortop];
  const lowerLeft = [thickbottom, roughtop, thicktop, thickbottom, roughbottom, roughtop];
  const lowerRight = [roughbottom, glosstop, roughtop, roughbottom, glossbottom, glosstop];

  const rawVertices = [bottom, top, upperLeft, upperRight, lowerLeft, lowerRight];
  return new Float32Array(rawVertices.flat(2))

}

function radarNormals(glyphGroup) {
  let [thick, rough, gloss, color] = glyphGroup.split('_');

  thick = axisNotch(thick, 4) * -1;
  rough = axisNotch(rough, 3) * -1;
  gloss = axisNotch(gloss, 3);
  color = axisNotch(color, 4);

  const rawNormals = [
    [0,0,-1],[0,0,-1],[0,0,-1],[0,0,-1],[0,0,-1],[0,0,-1], //bottom
    [0,0,1],[0,0,1],[0,0,1],[0,0,1],[0,0,1],[0,0,1], //top
    [-1*color,thick,0],[-1*color,thick,0],[-1*color,thick,0],[-1*color,thick,0],[-1*color,thick,0],[-1*color,thick,0], //upperLeft
    [color,gloss,0],[color,gloss,0],[color,gloss,0],[color,gloss,0],[color,gloss,0],[color,gloss,0], //upperRight
    [rough,thick,0],[rough,thick,0],[rough,thick,0],[rough,thick,0],[rough,thick,0],[rough,thick,0], //lowerLeft
    [-1*rough,-1*gloss,0],[-1*rough,-1*gloss,0],[-1*rough,-1*gloss,0],[-1*rough,-1*gloss,0],[-1*rough,-1*gloss,0],[-1*rough,-1*gloss,0] //lowerRight
  ];
  return new Float32Array(rawNormals.flat())
}

/*Text------------------------------------------------------------------------*/

function writeTitleArray(globalInstanceId) {
  return [
    data['man'][globalInstanceId],
    data['bran'][globalInstanceId],
    data['year'][globalInstanceId]
  ]
}

function writeInfoArray(globalInstanceId) {
  let textureWord = data['textureWord'][globalInstanceId];
  let glossWord = data['glossWord'][globalInstanceId];

  textureWord = textureWord === '_' ? '' : textureWord;
  glossWord = glossWord === '_' ? '' : glossWord;

  return [textureWord + " " + glossWord]
}

const pCatsTitle = [ "man", "bran", "year" ];
const pCatsInfo = [ "textureWord" ];

function writePanel(globalInstanceId) {
  select("#catalog")
    .append("p")
    .text("#"+data['catalog'][globalInstanceId])

  select("#titleBar")
    .selectAll("p.title")
    .data(writeTitleArray(globalInstanceId))
    .enter()
    .append("p")
    .text(d => d)
    .attr("class", (d, i) => "title " + pCatsTitle[i])

  select("#infoBar")
    .selectAll("p.info")
    .data(writeInfoArray(globalInstanceId))
    .enter()
    .append("p")
    .text(d => d)
    .attr("class", (d, i) => "info " + pCatsInfo[i])
}

function clearInfoPanel() {
  select("#catalog")
    .selectAll("p")
    .remove()

  select("#infoBar")
    .selectAll("p")
    .remove()

  select("#titleBar")
    .selectAll("p")
    .remove()
}

/*Models----------------------------------------------------------------------*/

const animatedCoords = Array.from({ length: n }, () => [0, 0, 0]);

function interpolatePositions({ globalIndicesForThisMesh, model }, progress ) {
  globalIndicesForThisMesh.forEach((item, i) => {
    animatedCoords[item][0] = (1 - progress) * animatedCoords[item][0] + progress * data[model][globalIndicesForThisMesh[i]][0];
    animatedCoords[item][1] = (1 - progress) * animatedCoords[item][1] + progress * data[model][globalIndicesForThisMesh[i]][1];
    animatedCoords[item][2] = (1 - progress) * animatedCoords[item][2] + progress * data[model][globalIndicesForThisMesh[i]][2];
  });
}

const substrate = new Object3D();

function updatePositions({ globalIndicesForThisMesh, glyph, mesh }) {
  if (!mesh) return;
  globalIndicesForThisMesh.forEach((item, i) => {
    if ( glyph === 'radar') {
      substrate.position.set(animatedCoords[item][0],animatedCoords[item][1],0.25 * animatedCoords[item][2]);
    } else {
      substrate.position.set(animatedCoords[item][0],animatedCoords[item][1],animatedCoords[item][2]);
    }
    substrate.updateMatrix();
    mesh.setMatrixAt(i, substrate.matrix);
  });

  mesh.instanceMatrix.needsUpdate = true;
}

/*Colors----------------------------------------------------------------------*/

// Kodak, Agfa, Dupont, Ilford, Defender, Ansco, Darko, Forte, Luminos, Haloid, Oriental, Gevaert
// yellow, red, blue, white, green, lightblue, black, gold, palered, maroon, orange, purple
const manColors = [0xfab617, 0xfd5344, 0x143b72, 0xffffff, 0x588f28, 0x6379dd, 0x111111, 0x7c6c49, 0xda947d, 0x6f282e, 0xc36335, 0x363348, 0x808080]
const highlightColor = 0xff00ff;
const colorSubstrate = new Color();
const continuousColorCols = ['thickness','gloss','roughness','expressiveness','year'];
let colorVals;

function valToColor(arr) {
  arr = arr.map(d => parseFloat(d));
  const arrfiltered = arr.filter(d => d)
  const arrmax = Math.max(...arrfiltered);
  const arrmin = Math.min(...arrfiltered);
  const arrrange = arrmax - arrmin;
  const arrnorm = arr.map(d => (d - arrmin) / arrrange);
  const arrhsl = arrnorm.map(d => d ? "hsl(0,0%," + parseInt(d*100).toString() + "%)" : 0xbd590f);

  return arrhsl
}

/*instancedMesh---------------------------------------------------------------*/

const meshList = {};

function Glyphs({ glyphMap, glyphGroup, glyph, model, group, clickedItem, onClickItem, z, vertices, normals, itemSize, s }) {
  const globalIndicesForThisMesh = glyphMap[glyphGroup];

  const meshRef = useRef();
  const { invalidate } = useThree();

  useSpring({
    to: { animationProgress: 1 },
    from: { animationProgress: 0 },
    reset: true,
    config: {
      friction: 416,
      tension: 170,
      mass: 100,
    },
    onChange: (_, ctrl) => {
      interpolatePositions({ globalIndicesForThisMesh, model }, ctrl.get().animationProgress );
      updatePositions({ globalIndicesForThisMesh, glyph, mesh: meshRef.current });
      invalidate();
    },
  }, [model]);

  useLayoutEffect(() => {
    meshList[glyphGroup] = meshRef.current;

    if ( continuousColorCols.includes(group) ) {
      const baseData = data[group];
      colorVals = valToColor(baseData);
    } else {
      colorVals = data[group];
    }

    globalIndicesForThisMesh.forEach((item, i) => {
      if ( item !== clickedItem ) { // so we don't recolor the clicked point
        const colorVal = manColors[colorVals[item]] || colorVals[item];
        colorSubstrate.set(colorVal);
        meshRef.current.setColorAt(i, colorSubstrate);
      } else {
        // clickedGlobalInstanceId is guaranteed non-null here
        colorSubstrate.set(highlightColor);
        meshRef.current.setColorAt(i, colorSubstrate);
      }
    });
    meshRef.current.instanceColor.needsUpdate = true;
    invalidate();
  }, [group]);


  const handleClick = e => {
    // this appears to select first raycast intersection, but not sure
    e.stopPropagation();

    const { delta, instanceId } = e;
    const globalInstanceId = globalIndicesForThisMesh[instanceId];

    if ( delta <= 5 ) {

      clearInfoPanel();

      // full color update every click
      Object.keys(glyphMap).forEach((item, i) => {
        const mesh = meshList[item];
        glyphMap[item].forEach((globalIndex, j) => {
          const colorVal = manColors[colorVals[globalIndex]] || colorVals[globalIndex];
          if ( globalIndex !== globalInstanceId ) {
            colorSubstrate.set(colorVal);
            mesh.setColorAt(j, colorSubstrate);
          } else if ( globalIndex === globalInstanceId ) {
            if ( globalIndex !== clickedItem ) {
              writePanel(globalInstanceId)
              colorSubstrate.set(highlightColor);
              mesh.setColorAt(j, colorSubstrate);
              onClickItem(globalInstanceId);
            } else {
              colorSubstrate.set(colorVal);
              mesh.setColorAt(j, colorSubstrate);
              onClickItem(null);
            }
          }
          mesh.instanceColor.needsUpdate = true;
          invalidate();
        });
      });
    }
  }

  if ( glyph === 'box' ) {
    return (
      <instancedMesh ref={meshRef} args={[null, null, n]} onClick={handleClick} name={glyphGroup}>
        <boxBufferGeometry args={[0.75, 0.75, 0.75]}></boxBufferGeometry>
        <meshStandardMaterial attach="material" />
      </instancedMesh>
    )
  } else if ( glyph === 'exp' ) {
    return (
      <instancedMesh ref={meshRef} args={[null, null, glyphMap[glyphGroup].length]} onClick={handleClick} name={glyphGroup}>
        <boxBufferGeometry args={[s, s, s]}></boxBufferGeometry>
        <meshStandardMaterial attach="material"/>
      </instancedMesh>
    )
  } else if ( glyph === 'iso' ) {
    return (
      <instancedMesh ref={meshRef} args={[null, null, glyphMap[glyphGroup].length]} onClick={handleClick} name={glyphGroup}>
        <boxBufferGeometry args={[0.75, 0.75, z]}></boxBufferGeometry>
        <meshStandardMaterial attach="material"/>
      </instancedMesh>
    )
  } else if ( glyph === 'radar' ) {
    return (
      <instancedMesh ref={meshRef} args={[null, null, glyphMap[glyphGroup].length]} onClick={handleClick} name={glyphGroup}>
        <bufferGeometry>
          <bufferAttribute
            attachObject={["attributes", "position"]}
            array={vertices}
            count={vertices.length / itemSize}
            itemSize={itemSize}
          />
          <bufferAttribute
            attachObject={["attributes", "normal"]}
            array={normals}
            count={normals.length / itemSize}
            itemSize={itemSize}
          />
        </bufferGeometry>
        <meshStandardMaterial attach="material" side={DoubleSide}/>
      </instancedMesh>
    )
  }
}

/*App-------------------------------------------------------------------------*/

export default function App() {
  const [model, setModel] = useState('grid');
  const [group, setGroup] = useState('colorGroupBinder');
  const [clickedItem, setClickedItem] = useState(null);
  const [glyph, setGlyph] = useState('box');
  const itemSize = 3;

  // key code constants
  const ALT_KEY = 18;
  const CTRL_KEY = 17;
  const CMD_KEY = 91;

  const exprStringToFloat = exprString => {
    exprString = exprString.substring(1);
    const s = Number(exprString) / 10;
    return s
  };

  return (
    <div id='app'>
      <div id='infoPanel'>
        <div id='catalog'></div>
        <div id='titleBar'></div>
        <div id='infoBar'></div>
      </div>
      <div id='viewpane'>
        <Canvas dpr={[1, 2]} camera={{ position: [0, 0, 75], far: 20000 }} frameloop="demand">
          <color attach="background" args={[0x505050]} />
          <ambientLight intensity={0.5}/>
          <pointLight position={[0, 0, 135]} intensity={0.5}/>
          {glyph==='box' && boxGroupArray.map((d,i) => {
            return <Glyphs key={i} glyphMap={boxMap} glyphGroup={d} glyph={glyph} model={model} group={group} clickedItem={clickedItem} onClickItem={setClickedItem} z={null} vertices={null} normals={null} itemSize={null} s={null}/>
          })}
          {glyph==='exp' && expressivenessGroupArray.map((d,i) => {
            return <Glyphs key={i} glyphMap={expressivenessMap} glyphGroup={d} glyph={glyph} model={model} group={group} clickedItem={clickedItem} onClickItem={setClickedItem} z={null} vertices={null} normals={null} itemSize={null} s={exprStringToFloat(d)}/>
          })}
          {glyph==='iso' && isoGroupArray.map((d,i) => {
            return <Glyphs key={i} glyphMap={isoMap} glyphGroup={d} glyph={glyph} model={model} group={group} clickedItem={clickedItem} onClickItem={setClickedItem} z={zArray[i]} vertices={null} normals={null} itemSize={null} s={null}/>
          })}
          {glyph==='radar' && radarGroupArray.map((d,i) => {
            return <Glyphs key={i} glyphMap={radarMap} glyphGroup={d} glyph={glyph} model={model} group={group} clickedItem={clickedItem} onClickItem={setClickedItem} z={null} vertices={radarVertices(d)} normals={radarNormals(d)} itemSize={itemSize} s={null}/>
          })}
          <OrbitControls
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            keys={[
              ALT_KEY, // orbit
              CTRL_KEY, // zoom
              CMD_KEY, // pan
            ]}
            mouseButtons={{
              LEFT: MOUSE.PAN, // make pan the default instead of rotate
              MIDDLE: MOUSE.ZOOM,
              RIGHT: MOUSE.ROTATE,
            }}
          />
        </Canvas>
      </div>
      <div id='bottomControls'>
        <div className='controls' id='glyphControls'>
          <button onClick={() => setGlyph('box')} className={glyph === 'box' ? 'active' : undefined}>BOX</button>
          <button onClick={() => setGlyph('exp')} className={glyph === 'exp' ? 'active' : undefined}>EXP</button>
          <button onClick={() => setGlyph('iso')} className={glyph === 'iso' ? 'active' : undefined}>ISO</button>
          <button onClick={() => setGlyph('radar')} className={glyph === 'radar' ? 'active' : undefined}>RAD</button>
        </div>
        <div className='controls' id='facetControls'>
          <button className='controls' onClick={() => console.log('2D')} >FACET 2D</button>
          <button className='controls' onClick={() => console.log('3D')} >FACET 3D</button>
        </div>
        <div className='controls' id='axisMenus'>
          <select value={'x'} onChange={()=>console.log('x')} title='x'>
            <option value='x'>x</option>
            <option value='y'>gloss</option>
            <option value='unit'>color</option>
            <option value='z'>roughness</option>
          </select>
          <button className='controls' title='asc' onClick={()=>console.log('asc')} >ASC</button>
          <select value={'y'} onChange={()=>console.log('y')} title='y'>
            <option value='x'>thickness</option>
            <option value='y'>y</option>
            <option value='unit'>color</option>
            <option value='z'>roughness</option>
          </select>
          <button className='controls' title='asc' onClick={()=>console.log('asc')} >ASC</button>
          <select value={'z'} onChange={()=>console.log('z')} title='z'>
            <option value='x'>thickness</option>
            <option value='y'>gloss</option>
            <option value='unit'>color</option>
            <option value='z'>z</option>
          </select>
          <button className='controls' title='asc' onClick={()=>console.log('asc')} >ASC</button>
          <select value={'facet'} onChange={()=>console.log('facet')} title='facet'>
            <option value='x'>thickness</option>
            <option value='y'>gloss</option>
            <option value='facet'>facet</option>
            <option value='z'>roughness</option>
          </select>
          <button className='controls' title='asc' onClick={()=>console.log('asc')} >ASC</button>
          <select value={group} onChange={e => setGroup(e.target.value)} title='color'>
            <option value='colorGroupBinder'>binder</option>
            <option value='colorGroupMan'>manufacturer</option>
            <option value='colorGroupTextureWord'>texture description</option>
            <option value='colorGroupColorWord'>base color description</option>
            <option value='colorGroupGlossWord'>gloss description</option>
            <option value='colorGroupThickWord'>weight description</option>
            <option value='colorString'>color</option>
            <option value='colorStringSat'>saturation</option>
            <option value='colorStringHue'>hue</option>
            <option value='thickness'>thickness</option>
            <option value='gloss'>gloss</option>
            <option value='roughness'>roughness</option>
            <option value='expressiveness'>expressiveness</option>
            <option value='year'>year</option>
          </select>
        </div>
      </div>
      <div className='controls' id='plottypeControls'>
        <button className={model === 'grid' ? 'active' : undefined} onClick={() => setModel('grid')} >MONTAGE</button>
        <button className={model === 'hist' ? 'active' : undefined} onClick={() => setModel('hist')} >HISTOGRAM</button>
        <button className={model === 'tsne' ? 'active' : undefined} onClick={() => setModel('tsne')} >SCATTER</button>
        <button className={model === 'entourage' ? 'active' : undefined} onClick={() => setModel('gep')} >ENTOURAGE</button>
      </div>
    </div>
  )
}
