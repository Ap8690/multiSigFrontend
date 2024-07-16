import React, {useState} from "react"
import { useNavigate } from "react-router-dom";
import Button from "@mui/material/Button"
import {useAccount, useReadContract, useWriteContract} from "wagmi"
import {WalletOptions} from "../wagmiProvider/connecters"
import {factoryAbi, factoryAddress} from "../contracts/factoryContract"
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from "@mui/material"
import DeleteIcon from "@mui/icons-material/Delete"

const factoryContract = {
  address: factoryAddress,
  abi: factoryAbi,
}

const Login = () => {
  const {isConnected} = useAccount()
  const [noOfSigners, setNoOfSiners] = useState(1)
  const [openAddFund, setOpenAddFund] = useState(false)
  const [signers, setSigners] = useState([])
  const [numberOfConfirmations, setNumberOfConfirmations] = useState(1)
  const {writeContractAsync} = useWriteContract()
  const navigate = useNavigate();
  const {data} = useReadContract({
    ...factoryContract,
    functionName: "getWallets",
    args: [],
  })

  console.log(data,"data")
  const handleAddFund = () => {
    setOpenAddFund(false)
    setNoOfSiners(1)
    setNumberOfConfirmations(1)
    setSigners([])
  }

  const handleInputChange = e => {
    e.preventDefault()
    setSigners([...signers, e.target.value])
  }

  const handleDelete = index => {
    const _signers = signers
    _signers[index] = _signers[_signers.length - 1]
    setSigners(_signers)
    setNoOfSiners(noOfSigners - 1)
  }

  const createWallet = async () => {
    console.log("dgfjidvfuyfudvcguc")
    try {
      const salt = process.env.REACT_APP_WALLET_SALT
      console.log(salt, "salt")
      if (numberOfConfirmations < 1 || numberOfConfirmations > 3)
        throw new Error(
          "Can't create less than 1 and more than 3 confirmations"
        )
      console.log(signers, numberOfConfirmations, "salt", salt)
      await writeContractAsync({
        ...factoryContract,
        functionName: "deploy",
        args: [salt, signers, numberOfConfirmations],
      })
    } catch (error) {
      alert(error?.message || "Something went wrong")
    }
  }

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        flexDirection: "column",
      }}
    >
      {!isConnected ? (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            justifyItems: "center",
            flexDirection: "column",
          }}
        >
          <WalletOptions />
        </div>
      ) : (
        <div>
          {" "}
          <h1
            style={{
              display: "flex",
              justifyContent: "center",
              flexDirection: "row",
            }}
          >
            MutilSig Wallet
          </h1>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              flexDirection: "row",
            }}
          >
            <Button variant="text" onClick={() => setOpenAddFund(true)}>
              Create Wallet
            </Button>
          </div>
          {data?.length > 0 ? data?.map((value, index)=> (
            <p
            key={index}
            style={{
              display: "flex",
              justifyContent: "center",
              flexDirection: "row",
              cursor: "pointer",
            }}
            onClick={()=>navigate('/wallet/' + value)}
          >
            {value}
          </p>
          )) :
          <p
            style={{
              display: "flex",
              justifyContent: "center",
              flexDirection: "row",
            }}
          >
            no Wallet found
          </p>
        }
        </div>
      )}
      <Dialog onClose={handleAddFund} open={openAddFund}>
        <DialogTitle>Add Fund</DialogTitle>
        <DialogContent>
          <div>
            {Array.from({length: noOfSigners}).map((_, index) => (
              <div
                key={index}
                style={{
                  paddingBottom: "5px",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <TextField
                  id="outlined-basic"
                  label={"signer" + (index + 1)}
                  variant="outlined"
                  style={{paddingLeft: "5px"}}
                  onChange={e => handleInputChange(e)}
                />
                <div onClick={() => handleDelete(index)}>
                  <DeleteIcon />
                </div>
              </div>
            ))}
            {noOfSigners < 3 && (
              <Button onClick={() => setNoOfSiners(noOfSigners + 1)}>
                Add Signer
              </Button>
            )}
          </div>
          <TextField
            id="outlined-basic"
            label="number of contfirmations required"
            ariant="outlined"
            value={numberOfConfirmations}
            onChange={(e) => setNumberOfConfirmations(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button variant="contained" onClick={createWallet}>
            Create Wallet
          </Button>
          <Button variant="contained" onClick={handleAddFund}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  )
}

export default Login
