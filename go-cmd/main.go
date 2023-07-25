package main

import (
	"crypto/ecdsa"
	"fmt"
	"log"
	"math"
	"math/big"
	"net/http"
	"net/rpc"
	"os"
	"time"

	"github.com/ethereum/go-ethereum/crypto"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func getPriceWithDeviation(price float64, genesisTimestamp int64) float64 {
	millisecondsInCycle := 2548992000          // 2555200 seconds to milliseconds
	currentTime := time.Now().UnixNano() / 1e6 // Get the current time in milliseconds
	timeDifference := currentTime - genesisTimestamp

	// Calculate the phase of the sine wave (ranging from 0 to 2 * math.Pi)
	phase := math.Pi * (float64(int(timeDifference) % millisecondsInCycle)) / float64(millisecondsInCycle)

	// Calculate the deviation factor using the sine function (oscillating between -1 and 1)
	deviationFactor := math.Sin(phase)

	// Calculate the deviation amount (5% of the price) and apply it to the original price
	deviationAmount := 0.05 * deviationFactor

	// Calculate the final price after deviation
	finalPrice := price * (1 - deviationAmount)

	return finalPrice
}

// CustomProvider implements the accounts.Account and bind.ContractBackend interfaces.
type CustomProvider struct {
	rpcClient  *rpc.Client
	privateKey *ecdsa.PrivateKey
}

// NewCustomProvider creates a new instance of the CustomProvider.
func NewCustomProvider(endpoint, privateKeyStr string) (*CustomProvider, error) {
	// Connect to your custom Ethereum provider.
	rpcClient, err := rpc.Dial(endpoint, "")
	if err != nil {
		return nil, err
	}

	// Convert the private key string to a private key object.
	privateKey, err := crypto.HexToECDSA(privateKeyStr)
	if err != nil {
		return nil, err
	}

	return &CustomProvider{
		rpcClient:  rpcClient,
		privateKey: privateKey,
	}, nil
}

func main() {

	err := godotenv.Load()

	if err != nil {
		log.Fatal("Error loading .env file")
	}

	price := 10.0                                // Replace with the actual price value
	lastNewMoonTimestamp := int64(1689618660000) // Last New Moon

	router := gin.Default()

	// Enable CORS
	config := cors.DefaultConfig()
	config.AllowAllOrigins = true
	config.AllowHeaders = []string{"Origin", "Content-Length", "Content-Type", "Authorization"}
	router.Use(cors.New(config))

	router.GET("/", func(c *gin.Context) {
		// endpoint := "https://nodes.sequence.app/polygon"

		privateKeyStr, exists := os.LookupEnv("PKEY")
		if !exists {
			log.Fatalf("Private key environment variable not found.")
		}

		celcius := big.NewInt(int64(20))
		blockNumber := 100

		dataToHash := append(celcius.Bytes(), big.NewInt(int64(blockNumber)).Bytes()...)
		log.Println("Signature:", fmt.Sprintf("0x%x", dataToHash))

		// Calculate the hash.
		hash := crypto.Keccak256Hash(dataToHash)
		log.Println("Signature:", fmt.Sprintf("0x%x", hash))

		privateKey, err := crypto.HexToECDSA(privateKeyStr)
		signature, err := crypto.Sign(hash.Bytes(), privateKey)

		if err != nil {
			log.Fatalf("Failed to sign the message: %v", err)
		}

		signatureStr := fmt.Sprintf("0x%x", signature)

		// Now you can use the signature for further processing or sending the response.
		log.Println("Signature:", signatureStr)

		returnValue := gin.H{
			"price": getPriceWithDeviation(price, lastNewMoonTimestamp) * 1e18,
			"sig":   signature,
		}

		c.JSON(http.StatusOK, returnValue)
	})

	router.Run(":8000")
}
