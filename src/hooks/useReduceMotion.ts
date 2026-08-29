import {useEffect, useState} from 'react';
import {AccessibilityInfo} from 'react-native';

/**
 * True when the child's device asks for reduced motion (iOS: Settings >
 * Accessibility > Motion > Reduce Motion; Android: Remove animations).
 *
 * The app's celebrations are deliberately busy — twenty particles on a correct
 * answer, falling confetti between problems, a full-screen burst on level
 * complete. That is right for most 4-6 year olds and wrong for a child with
 * vestibular sensitivity or a seizure disorder, whose parent has already set
 * this switch and expects apps to honour it.
 *
 * Consumers should drop the particles and keep the outcome: the child must
 * still see that they were right.
 */
export function useReduceMotion(): boolean {
  const [reduce, setReduce] = useState(false);

  useEffect(() => {
    let mounted = true;

    AccessibilityInfo.isReduceMotionEnabled()
      .then(value => {
        if (mounted) setReduce(value);
      })
      .catch(() => {
        // Platform declined to answer — assume motion is fine, which is the
        // pre-existing behaviour.
      });

    const sub = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      value => setReduce(value),
    );

    return () => {
      mounted = false;
      sub.remove();
    };
  }, []);

  return reduce;
}
