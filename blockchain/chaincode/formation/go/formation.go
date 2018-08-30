/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

/*
 * The sample smart contract for documentation topic:
 * Writing Your First Blockchain Application
 */

package main

/* Imports
 * 4 utility libraries for formatting, handling bytes, reading and writing JSON, and string manipulation
 * 2 specific Hyperledger Fabric specific libraries for Smart Contracts
 */
import (
	"bytes"
	"encoding/json"
	"fmt"
	"strconv"

	"github.com/hyperledger/fabric/core/chaincode/shim"
	sc "github.com/hyperledger/fabric/protos/peer"
)

// Define the Smart Contract structure
type SmartContract struct {
}

// Define the car structure, with 4 properties.  Structure tags are used by encoding/json library
type Formation struct {
	Date   string `json:"Date"`
	Formateur  string `json:"Formateur"`
	Volume string `json:"Volume"`
}

/*
 * The Init method is called when the Smart Contract "fabcar" is instantiated by the blockchain network
 * Best practice is to have any Ledger initialization in separate function -- see initLedger()
 */
func (s *SmartContract) Init(APIstub shim.ChaincodeStubInterface) sc.Response {
	return shim.Success(nil)
}

/*
 * The Invoke method is called as a result of an application request to run the Smart Contract "fabcar"
 * The calling application program has also specified the particular smart contract function to be called, with arguments
 */
func (s *SmartContract) Invoke(APIstub shim.ChaincodeStubInterface) sc.Response {

	// Retrieve the requested Smart Contract function and arguments
	function, args := APIstub.GetFunctionAndParameters()
	// Route to the appropriate handler function to interact with the ledger appropriately
	if function == "queryFormation" {
		return s.queryFormation(APIstub, args)
	} else if function == "initLedger" {
		return s.initLedger(APIstub)
	} else if function == "createFormation" {
		return s.createFormation(APIstub, args)
	} else if function == "queryAllFormations" {
		return s.queryAllFormations(APIstub)
	}else if function == "queryByFormateur" {
		return s.queryByFormateur(APIstub, args)
	}

	return shim.Error("Invalid Smart Contract function name.")
}

func (s *SmartContract) queryFormation(APIstub shim.ChaincodeStubInterface, args []string) sc.Response {

	if len(args) != 1 {
		return shim.Error("Incorrect number of arguments. Expecting 1")
	}

	formationAsBytes, _ := APIstub.GetState(args[0])
	return shim.Success(formationAsBytes)
}

func (s *SmartContract) initLedger(APIstub shim.ChaincodeStubInterface) sc.Response {
	formations := []Formation{
		Formation{Date: "2017-01-01", Formateur: "Alpha", Volume: "7"},
		Formation{Date: "2017-01-01", Formateur: "Bravo", Volume: "1"},
		Formation{Date: "2017-01-01", Formateur: "Charlie", Volume: "2"},
		Formation{Date: "2017-01-01", Formateur: "Delta", Volume: "1.5"},
		Formation{Date: "2017-01-01", Formateur: "Echo", Volume: "0.5"},
		Formation{Date: "2017-01-01", Formateur: "Fox", Volume: "2"},
		Formation{Date: "2017-01-01", Formateur: "Golf", Volume: "1"},
	}

	i := 0
	for i < len(formations) {
		fmt.Println("i is ", i)
		formationAsBytes, _ := json.Marshal(formations[i])
		APIstub.PutState("FOR"+strconv.Itoa(i), formationAsBytes)
		fmt.Println("Added", formations[i])
		i = i + 1
	}

	return shim.Success(nil)
}

func (s *SmartContract) createFormation(APIstub shim.ChaincodeStubInterface, args []string) sc.Response {

	if len(args) != 4 {
		return shim.Error("Incorrect number of arguments. Expecting 4")
	}

	var formation = Formation{Date: args[1], Formateur: args[2], Volume: args[3]}

	formationAsBytes, _ := json.Marshal(formation)
	APIstub.PutState(args[0], formationAsBytes)

	return shim.Success(nil)
}

func (s *SmartContract) queryAllFormations(APIstub shim.ChaincodeStubInterface) sc.Response {

	startKey := "FOR0"
	endKey := "FOR999"

	resultsIterator, err := APIstub.GetStateByRange(startKey, endKey)
	if err != nil {
		return shim.Error(err.Error())
	}
	defer resultsIterator.Close()

	// buffer is a JSON array containing QueryResults
	var buffer bytes.Buffer
	buffer.WriteString("[")

	bArrayMemberAlreadyWritten := false
	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			return shim.Error(err.Error())
		}
		// Add a comma before array members, suppress it for the first array member
		if bArrayMemberAlreadyWritten == true {
			buffer.WriteString(",")
		}
		buffer.WriteString("{\"Key\":")
		buffer.WriteString("\"")
		buffer.WriteString(queryResponse.Key)
		buffer.WriteString("\"")

		buffer.WriteString(", \"Record\":")
		// Record is a JSON object, so we write as-is
		buffer.WriteString(string(queryResponse.Value))
		buffer.WriteString("}")
		bArrayMemberAlreadyWritten = true
	}
	buffer.WriteString("]")

	fmt.Printf("- queryAllFormatios:\n%s\n", buffer.String())

	return shim.Success(buffer.Bytes())
}

func (s *SmartContract) queryByFormateur(APIstub shim.ChaincodeStubInterface ,args[]string) sc.Response {

	startKey := "FOR0"
	endKey := "FOR999"
	var buffer bytes.Buffer
	resultsIterator, err := APIstub.GetStateByRange(startKey, endKey)
	if err != nil {
		return shim.Error(err.Error())
	}
	defer resultsIterator.Close()
	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		str := string(queryResponse.Value)
    res := Formation{}
    json.Unmarshal([]byte(str), &res)
		if err != nil {
			return shim.Error(err.Error())
		}
		if res.Formateur==args[0]{
			buffer.WriteString(string(queryResponse.Value))
		}
	}
	return shim.Success(buffer.Bytes())
}

// The main function is only relevant in unit test mode. Only included here for completeness.
func main() {

	// Create a new Smart Contract
	err := shim.Start(new(SmartContract))
	if err != nil {
		fmt.Printf("Error creating new Smart Contract: %s", err)
	}
}
