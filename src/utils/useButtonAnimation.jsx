import { useRef } from 'react';
import { gsap } from 'gsap';

const useButtonAnimation = (initialRef, customEnter, customLeave) => {

    const ref = initialRef || useRef();

    const enter = customEnter || ((e) => {
        e.stopPropagation();
        gsap.to(ref.current.scale, {
            y: 0.5,
            duration: 0.5
        });
        console.log('enter');
    });

    const leave = customLeave || ((e) => {
        e.stopPropagation();
        gsap.to(ref.current.scale, {
            x: 1,
            y: 1,
            z: 1,
            duration: 0.5
        });
    });

    return { ref, enter, leave };
};

export default useButtonAnimation;
