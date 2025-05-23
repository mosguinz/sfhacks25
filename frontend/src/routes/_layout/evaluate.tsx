import { ClassificationService } from "@/client"
import {
  Box,
  Button,
  Grid,
  Heading,
  Image,
  Input,
  SimpleGrid,
  Skeleton,
  Text,
  VStack,
} from "@chakra-ui/react"
import { createFileRoute, Link as RouterLink } from "@tanstack/react-router"
import { useState } from "react"

type EvaluationResults = {
  diagnosis: string
  confidence: number
  // recommendations: string
}

export const Route = createFileRoute("/_layout/evaluate")({
  component: ImageEvaluation,
  beforeLoad: async () => {
    // TODO: handle unauthorized here
  },
})

function ImageEvaluation() {
  const [images, setImages] = useState<(string | null)[]>(Array(4).fill(null))
  const [storeImages, setStoreImages] = useState<File[]>([])
  const [isEvaluating, setIsEvaluating] = useState(false)
  // const [results, setResults] = useState<EvaluationResults | null>(null)
  const [results, setResults] = useState<EvaluationResults[]>([])
  // const storeImages = []

  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number,
  ) => {
    console.log("hijjj")
    const file = e.target.files?.[0]
    if (file) {
      const x = await ClassificationService.classifyBreastImage({
        formData: { file: file },
      })
      console.log(x)
      // console.log(file)

      setStoreImages((prevImages) => {
        const newImages = [...prevImages] // Copy the previous state
        newImages[index] = file // Replace the image at the specified index
        return newImages // Return the updated array
      })

      const reader = new FileReader()
      reader.onloadend = () => {
        const newImages = [...images]
        newImages[index] = reader.result as string
        setImages(newImages)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeImage = (index: number) => {
    const newImages = [...images]
    newImages[index] = null
    setImages(newImages)
  }

  const handleEvaluate = async () => {
    setIsEvaluating(true)
    // setResults(null)
    setResults([])
    // console.log(images)
    // const test = await ClassificationService.classifyImage( {formData: {file: storeImages[0]}} )
    // console.log(test)

    // {storeImages.map((images) => (
    //   // console.log(images)
    //   console.log( await ClassificationService.classifyImage( {formData: {file: storeImages[index]}} ) )
    // ))}
    ///////
    const evaluationResults: EvaluationResults[] = [] // Make sure the type is correct

    // Loop over storeImages and classify each one
    for (const file of storeImages) {
      const result = await ClassificationService.classifyBreastImage({
        formData: { file },
      })

      // Assuming `result` matches the shape of `EvaluationResults`
      const formattedResult: EvaluationResults = {
        diagnosis: result.diagnosis || "Normal", // Add defaults if necessary
        confidence: result.confidence || 0.95,
        // recommendations: result.recommendations || "Regular follow-up recommended",
      }

      evaluationResults.push(formattedResult) // Add the formatted result
    }

    // Update the `results` state with the populated evaluationResults
    setResults(evaluationResults)
    ////////
    setIsEvaluating(false)
  }

  const allImagesUploaded = images.every((img) => img !== null)

  const getLabel = (index: number) => {
    switch (index) {
      case 0:
        return "Left Mediolateral Oblique (MLO)"
      case 1:
        return "Right Mediolateral Oblique (MLO)"
      case 2:
        return "Left Craniocaudal (CC)"
      case 3:
        return "Right Craniocaudal (CC)"
      default:
        return "Unknown View"
    }
  }

  return (
    <Box p={8}>
      <Grid templateColumns={{ base: "1fr", lg: "2fr 1fr" }} gap={8}>
        {/* Main Upload Section */}
        <Box>
          <Heading size="3xl" mb={4}>
            Mammography Analyzer
          </Heading>

          {/* <Button variant="solid" type="submit">
            Go to Chest Scans{" "} */}
            <RouterLink to="/evaluate2" className="main-link">
              Chest X-ray Analyzer
            </RouterLink>
          {/* </Button> */}

          <Box h="1px" bg="gray.200" mb={4} />
          <Box mt={2}>
            <SimpleGrid columns={{ base: 1, md: 2 }} gap={12}>
              <ImageUploadColumn
                title="Left"
                mloIndex={0}
                ccIndex={2}
                images={images}
                onUpload={handleImageUpload}
                onRemove={removeImage}
              />
              <ImageUploadColumn
                title="Right"
                mloIndex={1}
                ccIndex={3}
                images={images}
                onUpload={handleImageUpload}
                onRemove={removeImage}
              />
            </SimpleGrid>
            {allImagesUploaded && (
              <Box display="flex" justifyContent="center" mt={8}>
                <Button
                  colorScheme="brand"
                  onClick={() => {
                    setImages(Array(4).fill(null))
                    setResults([])
                  }}
                  w="200px"
                >
                  Clear All Images
                </Button>
              </Box>
            )}
          </Box>
        </Box>

        {/* Right Sidebar */}
        <VStack align="stretch" gap={6} mt={16}>
          <Box p={4} borderWidth="1px" rounded="xl" bg="white" boxShadow="sm">
            <Heading
              size="md"
              mb={2}
              color={allImagesUploaded ? "inherit" : "gray.400"}
              transition="color 0.2s ease-in-out"
            >
              Ready to analyze
            </Heading>
            <Button
              colorScheme="brand"
              onClick={handleEvaluate}
              loading={isEvaluating}
              disabled={!allImagesUploaded}
              w="full"
            >
              Analyze
            </Button>
          </Box>

          <Box p={4} borderWidth="1px" rounded="xl" bg="white" boxShadow="sm">
            <Heading size="md" mb={2}>
              Patient Information
            </Heading>
            <Text color="gray.500">[Form or metadata goes here]</Text>
          </Box>

          {results && allImagesUploaded && (
            <Box p={4} borderWidth="1px" rounded="xl" bg="white" boxShadow="sm">
              <Heading size="md" mb={2}>
                Analysis Results
              </Heading>
              {results.map((result, index) => (
                <Box key={index} mb={4}>
                  <Text>
                    <strong>{getLabel(index)}:</strong>
                  </Text>
                  <Text>
                    <strong>Diagnosis:</strong> {result.diagnosis}
                  </Text>
                  <Text>
                    <strong>Confidence:</strong>{" "}
                    {(result.confidence * 100).toFixed(2)}%
                  </Text>
                  <Text>
                    {/* <strong>Recommendations:</strong> {result.recommendations} */}
                  </Text>
                </Box>
              ))}
            </Box>
          )}
        </VStack>
      </Grid>
    </Box>
  )
}

function ImageUploadColumn({
  title,
  mloIndex,
  ccIndex,
  images,
  onUpload,
  onRemove,
}: {
  title: string
  mloIndex: number
  ccIndex: number
  images: (string | null)[]
  onUpload: (e: React.ChangeEvent<HTMLInputElement>, i: number) => void
  onRemove: (i: number) => void
}) {
  return (
    <Box>
      <Heading size="xl" mb={2} color="brand.700">
        {title}
      </Heading>
      <VStack align="stretch" gap={4}>
        <ImageUploadBox
          label={`${title} Mediolateral Oblique (MLO)`}
          index={mloIndex}
          image={images[mloIndex]}
          onUpload={onUpload}
          onRemove={onRemove}
        />
        <ImageUploadBox
          label={`${title} Craniocaudal (CC)`}
          index={ccIndex}
          image={images[ccIndex]}
          onUpload={onUpload}
          onRemove={onRemove}
        />
      </VStack>
    </Box>
  )
}

function ImageUploadBox({
  label,
  index,
  image,
  onUpload,
  onRemove,
}: {
  label: string
  index: number
  image: string | null
  onUpload: (e: React.ChangeEvent<HTMLInputElement>, i: number) => void
  onRemove: (i: number) => void
}) {
  const [isPopupOpen, setIsPopupOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isImageLoaded, setIsImageLoaded] = useState(false)

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsLoading(true)
    setIsImageLoaded(false)
    onUpload(e, index)
  }

  const handleImageLoad = () => {
    setIsImageLoaded(true)
    setIsLoading(false)
  }

  return (
    <Box>
      {image ? (
        <Box
          position="relative"
          rounded="xl"
          overflow="hidden"
          transition="all 0.2s"
          boxShadow="0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)"
          _hover={{
            border: "1px solid",
            borderColor: "brand.300",
          }}
        >
          <Text
            position="absolute"
            top={2}
            left={2}
            bg="white"
            px={2}
            py={1}
            rounded="md"
            fontSize="sm"
            fontWeight="medium"
            zIndex={1}
            transition="opacity 0.2s ease-in-out"
            opacity={1}
            _groupHover={{ opacity: 0 }}
          >
            {label}
          </Text>
          <Box
            onClick={() => setIsPopupOpen(true)}
            cursor="pointer"
            role="group"
          >
            {isLoading && (
              <Skeleton
                height="180px"
                width="full"
                position="absolute"
                top={0}
                left={0}
              />
            )}
            <Image
              src={image}
              alt={label}
              w="full"
              h="180px"
              objectFit="contain"
              bg="gray.50"
              opacity={isImageLoaded ? 1 : 0}
              transition="opacity 0.3s ease-in-out"
              onLoad={handleImageLoad}
            />
          </Box>
          <Button
            position="absolute"
            top={1}
            right={1}
            size="xs"
            onClick={() => onRemove(index)}
            colorScheme="red"
          >
            ×
          </Button>

          {isPopupOpen && (
            <Box
              position="fixed"
              top={0}
              left={0}
              right={0}
              bottom={0}
              bg="blackAlpha.600"
              zIndex={999}
              onClick={() => setIsPopupOpen(false)}
              backdropFilter="blur(4px)"
            >
              <Box
                position="absolute"
                top="50%"
                left="50%"
                transform="translate(-50%, -50%)"
                bg="white"
                p={6}
                rounded="xl"
                boxShadow="2xl"
                zIndex={1000}
                w="800px"
                h="600px"
                display="flex"
                flexDirection="column"
              >
                <Button
                  position="absolute"
                  top={2}
                  right={2}
                  size="sm"
                  onClick={() => setIsPopupOpen(false)}
                  colorScheme="gray"
                >
                  ×
                </Button>
                <Box
                  flex={1}
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                >
                  <Image
                    src={image}
                    alt={label}
                    maxH="full"
                    maxW="full"
                    objectFit="contain"
                  />
                </Box>
              </Box>
            </Box>
          )}
        </Box>
      ) : (
        <Box
          as="label"
          position="relative"
          rounded="xl"
          h="180px"
          cursor="pointer"
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          transition="all 0.2s"
          border="1px solid"
          borderColor="gray.200"
          bg="white"
          _hover={{
            bg: "brand.50",
            borderColor: "brand.300",
            transform: "scale(1.02)",
            boxShadow:
              "0 8px 12px -1px rgba(0, 0, 0, 0.1), 0 4px 6px -1px rgba(0, 0, 0, 0.06)",
          }}
        >
          <Text
            position="absolute"
            top={2}
            left={2}
            fontSize="sm"
            fontWeight="medium"
          >
            {label}
          </Text>
          <Input
            type="file"
            accept="image/*"
            display="none"
            onChange={handleUpload}
          />
          {isLoading ? (
            <Skeleton height="180px" width="full" />
          ) : (
            <>
              <Text color="gray.400" fontSize="2xl">
                +
              </Text>
              <Text color="gray.500" fontSize="sm" mt={2}>
                Click to upload mammography image
              </Text>
            </>
          )}
        </Box>
      )}
    </Box>
  )
}
