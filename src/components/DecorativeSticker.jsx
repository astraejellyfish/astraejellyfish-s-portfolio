import { useSyncExternalStore } from 'react'
import { motion } from 'motion/react'

const motionQuery = '(prefers-reduced-motion: reduce)'
const subscribe = notify => {
  const query = window.matchMedia(motionQuery)
  query.addEventListener('change', notify)
  return () => query.removeEventListener('change', notify)
}
const readPreference = () => window.matchMedia(motionQuery).matches
const resting = { rotate: 0, scale: 1 }

export default function DecorativeSticker({ className, src, width, height, tilt = 4 }) {
  const reduceMotion = useSyncExternalStore(subscribe, readPreference, () => true)
  return (
    <motion.div className={className} initial={false} animate="rest" whileHover="hover">
      <motion.img
        src={src} alt="" width={width} height={height} draggable="false"
        variants={{ rest: resting, hover: reduceMotion ? resting : { rotate: tilt, scale: 1.05 } }}
        transition={reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 260, damping: 18, mass: 0.7 }}
      />
    </motion.div>
  )
}
