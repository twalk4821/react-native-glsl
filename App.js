/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow strict-local
 */

import React, { useRef, useEffect, useState } from 'react';
import { Animated, Easing, TouchableWithoutFeedback, Dimensions } from 'react-native'
import { Shaders, Node, GLSL } from "gl-react";
import { Surface } from "gl-react-native"; // for React Native

import withTime from './withTime';

const screenDimension = Dimensions.get('screen').width
const numberOfParticles = 100;

const xs = new Array(numberOfParticles)
  .fill(0)
  .map(x => Math.random());
const ys = new Array(numberOfParticles)
  .fill(0)
  .map(y => Math.random());
const slopes = new Array(numberOfParticles)
  .fill(0)
  .map(slope => (Math.random() - .5) * 4)

const small_size = 0.03;
const medium_size = 0.05;
const large_size = 0.1;

const size_choices = [
  small_size,
  medium_size,
  large_size
];

const sizes = new Array(numberOfParticles)
  .fill(0)
  .map(size => size_choices[Math.floor((Math.random() * 3))])

const fragShader = GLSL`
  uniform highp vec2 iResolution;
  uniform highp float iTime;
  uniform highp vec2 iMouse;

  ${xs.map((x, i) =>`lowp vec4 test${i} = vec4(${xs[i]}, ${ys[i]}, ${slopes[i]}, ${sizes[i]});`).join('')}

  const highp float path_length = 3.0;
  const highp vec3 background_color = vec3(0.0118, 0.0706, 0.3686);
  highp vec3 color = background_color;
  highp vec2 translation = vec2(0.0, 0.0);
  highp float pct = 0.0;
  highp vec2 position = vec2(0.0, 0.0);
  highp float slope = 1.0;
  highp float radius = 0.1;
  highp float speed = 0.05;

  void draw_particle(lowp vec4 particle, lowp vec2 screen, highp float i) {
    position = vec2(particle[0], particle[1]) * 3.0;
    slope = particle[2];
    radius = particle[3];
    speed = .004 / radius;

    translation = vec2(position.x + path_length*cos(iTime + i), slope * (position.x + path_length* cos(iTime + i)) + position.y);
    pct = smoothstep(radius, 0.0, distance(screen, translation));
    color = (1.0-pct)*color+pct*vec3(0.251, 0.251, 0.949);
  }

  lowp float rand(lowp float x) {
    return fract(sin(x)*100000.0);
  }

  void main() {
    highp vec2 screen = gl_FragCoord.xy/iResolution.xy;
    highp vec2 cursor = (iMouse.xy/iResolution.xy) * 3.0;
    
    
    ${xs.map((x, i) => `draw_particle(test${i}, screen, ${i}.0);`).join('')}

    radius = .25;

    pct = smoothstep(radius, 0.0, distance(screen, cursor));
    color = (1.0-pct)*color+pct*vec3(0.251, 1.0, 1.0);

    pct = smoothstep(radius, 0.0, distance(screen, cursor)) - smoothstep(radius, 0.0, distance(screen, cursor));
    color = (1.0-pct)*color+pct*vec3(0.251, 1.0, 1.0);

    gl_FragColor = vec4(color,1.0);

  }
`;

const shaders = Shaders.create({
  helloBlue: {
    frag: fragShader
  }
});

class HelloBlue extends React.Component {
  render() {
  const { clock, cursor } = this.props.style;
  const iMouse = [cursor.x, Math.abs(screenDimension - cursor.y)]
  return (
    <Node 
      shader={shaders.helloBlue} 
      uniforms={{ 
        iResolution: [screenDimension, screenDimension], 
        iTime: clock,
        iMouse
      }} 
    />
  )
  }


}

const AnimatedBlue = Animated.createAnimatedComponent(HelloBlue)

const App = props => {
  const [clock, setClock] = useState(new Animated.Value(0))
  const [cursor, setCursor] = useState(new Animated.ValueXY({ x: 0, y: 0 }))
  const ref = useRef();

  const onPress = (e) => {
    const {locationX, locationY} = e.nativeEvent;
    Animated.spring(cursor, {
      toValue: {
        x: locationX,
        y: locationY
      },
      useNativeDriver: false
    }).start();
  };
  
  const startClock = () => {
    Animated.timing(clock, {
      toValue: 2.0*Math.PI,
      duration: 200000,
      useNativeDriver: false,
      easing: Easing.linear
    }).start(() => {
      clock.setValue(0)
      startClock()
    });
  };

  useEffect(startClock, [])

  return (
    <>
    <TouchableWithoutFeedback  style={{width: screenDimension + 1, height: screenDimension + 1}} onPress={onPress} >
      <Surface style={{width: screenDimension, height: screenDimension}}>
        <AnimatedBlue style={{ clock, cursor }} />
      </Surface>
    </TouchableWithoutFeedback>
    </>
  );
}


export default App;
