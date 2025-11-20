'use client'

import { Box, Heading, Text, VStack } from '@chakra-ui/react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { StartButton } from './common/StartButton'

const MotionBox = motion(Box)
const MotionHeading = motion(Heading)
const MotionText = motion(Text)

export const LandingPage = () => {
    return (
        <VStack
            alignItems="center"
            as="section"
            gap={6}
            height="full"
            justifyContent="center"
            marginX="auto"
            textAlign="center"
            width="full"
            zIndex={20}
        >
            <MotionBox
                as="header"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 2 }}
                maxWidth={{ base: 320, md: 640 }}
                width="full"
            >
                <Image
                    alt="Arising: A Twirl of Destinies"
                    className="object-contain"
                    height={288}
                    priority
                    sizes="(max-width: 768px) 320px, 640px"
                    src="/assets/logo.webp"
                    width={870}
                />
            </MotionBox>

            <MotionHeading
                as="h1"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1, delay: 1.5 }}
                color="custom-blue"
                fontSize={{ base: '3xl', md: '5xl' }}
            >
                A Twirl of Destinies
            </MotionHeading>

            <MotionText
                as="p"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1, delay: 2 }}
                color="white"
                fontSize={{ base: 'md', md: 'lg' }}
                maxWidth="350px"
            >
                Every choice becomes history. Etia is the on-chain RPG that never forgets.
            </MotionText>

            <MotionBox initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 2.5 }} paddingY={5}>
                <StartButton />
            </MotionBox>
        </VStack>
    )
}
