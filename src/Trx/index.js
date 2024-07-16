import React, {useEffect, useState} from "react"
import Button from "@mui/material/Button"
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material"
import TextField from "@mui/material/TextField"
import {
  useAccount,
  useBalance,
  useReadContract,
  useSendTransaction,
  useWriteContract,
} from "wagmi"
import {useParams} from "react-router-dom"
import {walletAbi} from "../contracts/multiSigContract"
import {parseEther, parseUnits} from "viem"
import axios from "axios"
import * as ethers from "ethers"
import { getEthersSigner } from "../wagmiProvider/ethersSigner"
import { config } from "../wagmiProvider/config"

const Trx = () => {
  const [openAddFund, setOpenAddFund] = useState(false)
  const [openSubTrx, setOpenSubTrx] = useState(false)
  const {address} = useAccount()
  const param = useParams()
  const {sendTransactionAsync} = useSendTransaction()
  const {writeContractAsync} = useWriteContract()
  const [transactions, setTransactions] = useState([])

  const [txObj, setTxObj] = useState({
    to: "",
    amount: 0,
  })
  const {data} = useReadContract({
    address: param?.id,
    abi: walletAbi,
    functionName: "isSigner",
    args: [address],
  })
  const balance = useBalance({
    address: param?.id,
    refetch: true,
  })
  const [amount, setAmount] = useState(0)

  const handleAddFund = () => {
    setOpenAddFund(false)
  }

  const handleSubTrx = () => {
    setOpenSubTrx(false)
  }

  const testOpneDilog = () => {
    setOpenAddFund(true)
  }

  const openSubTrxDilog = () => {
    setOpenSubTrx(true)
  }

  const addFunds = async () => {
    try {
      if (amount <= 0) throw new Error("Please enter a positive amount")
      await sendTransactionAsync({
        to: param?.id,
        value: parseEther(amount),
      })
      handleAddFund()
    } catch (error) {
      alert(error.message || "Something went wrong")
    }
  }

  const getTransactions = async () => {
    const {data} = await axios.post(
      process.env.REACT_APP_API_URL + "transaction/getTransaction",
      {
        wallet: param?.id,
      }
    )
    setTransactions(data.transactions)
  }

  const addTransaction = async () => {
    try {
      if (txObj?.amount <= 0) throw new Error("Please enter a positive amount")
      if (!txObj.to) throw new Error("Please enter a to address")
      await axios.post(
        process.env.REACT_APP_API_URL + "transaction/saveTransaction",
        {
          to: txObj.to,
          amount: Number(parseUnits(txObj.amount, 18)),
          wallet: param?.id,
        }
      )
      await getTransactions()
      handleSubTrx()
    } catch (error) {
      console.log(error,"error")
      alert(error.message || "Something went wrong")
    }
  }

  useEffect(() => {
    getTransactions()
  }, [])

  const executeTx = async transaction => {
    try {
      if(transaction?.executed) throw new Error("Transaction is already executed")
      const signatures = transaction?.signatures?.map(
        signature => signature.signature
      )
      await writeContractAsync({
        address: param?.id,
        abi: walletAbi,
        functionName: "executeTransaction",
        args: [transaction?.to, transaction?.amount, signatures],
      })
      await axios.post(
        process.env.REACT_APP_API_URL + "transaction/executeTransaction",
        {
          transactionId: transaction?._id,
        }
      )
      await getTransactions()
    } catch (error) {
      alert(error.message || "Something went wrong")
    }
  }
  
  const signTransaction = async transaction => {
    try {
      if(transaction?.executed) throw new Error("Transaction is already executed")
      const domain = {
        name: 'MyDApp',
        version: '1',
        chainId: 11155111, 
        verifyingContract: param?.id,
      };
  
      const types = {
        Data: [
          { name: 'to', type: 'address' },
          { name: 'amount', type: 'uint256' },
        ],
      };
  
      const value = {
        to: transaction?.to,
        amount: transaction?.amount?.toString(),
      };
      const signer = await getEthersSigner(config);
      const data = await signer.signTypedData(domain, types, value)
      await axios.post(
        process.env.REACT_APP_API_URL + "transaction/signTransaction",
        {
          signature: data,
          transactionId: transaction?._id,
          signer: address,
        }
      )
      await getTransactions()
    } catch (error) {
      console.log(error,"error");
      alert(error.message || "Something went wrong")
    }
  }

  return (
    <>
      {!data ? (
        <p>You are not the owner of the wallet</p>
      ) : (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            flexDirection: "column",
            padding: 20,
            margin: 20,
          }}
        >
          <Grid
            item
            container
            direction="row"
            justifyContent="space-around"
            alignItems="center"
            width={"100%"}
          >
            <Button variant="contained" onClick={() => openSubTrxDilog()}>
              Add Transaction
            </Button>
            <Button variant="contained" onClick={() => testOpneDilog()}>
              Add Fund
            </Button>
            <text>Balance: {balance?.data?.formatted}</text>
          </Grid>
          <TableContainer component={Paper} style={{marginTop: "20px"}}>
            <Table sx={{minWidth: 650}} size="small" aria-label="a dense table">
              <TableHead>
                <TableRow>
                  <TableCell>To</TableCell>
                  <TableCell align="center">Amount</TableCell>
                  <TableCell align="center">Executed</TableCell>
                  <TableCell align="center" onClick={testOpneDilog}>
                    Sign
                  </TableCell>
                  <TableCell align="center">Execute</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {transactions?.length > 0 &&
                  transactions?.map(transaction => (
                    <TableRow>
                      <TableCell align="left">{transaction?.to}</TableCell>
                      <TableCell align="center">
                        {transaction?.amount/10**18}
                      </TableCell>
                      <TableCell align="center">
                        {transaction.executed ? "true" : "false"}
                      </TableCell>
                      <TableCell align="center">
                        <Button
                          variant="contained"
                          onClick={() => signTransaction(transaction)}
                        >
                          Sign
                        </Button>
                      </TableCell>
                      <TableCell align="center">
                        <Button
                          variant="contained"
                          onClick={() => executeTx(transaction)}
                        >
                          Execute
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Dialog onClose={handleAddFund} open={openAddFund}>
            <DialogTitle>Add Fund</DialogTitle>
            <DialogContent>
              <TextField
                id="outlined-basic"
                label="add fund"
                variant="outlined"
                value={amount}
                onChange={e => setAmount(e.target.value)}
              />
            </DialogContent>
            <DialogActions>
              <Button variant="contained" onClick={() => addFunds()}>
                Add Fund
              </Button>
              <Button variant="contained" onClick={handleAddFund}>
                Close
              </Button>
            </DialogActions>
          </Dialog>

          <Dialog onClose={setOpenSubTrx} open={openSubTrx}>
            <DialogTitle>Submit Transaction</DialogTitle>
            <DialogContent
              style={{display: "flex", flexDirection: "column", gap: "10px"}}
            >
              <TextField
                id="outlined-basic"
                label="to address"
                variant="outlined"
                onChange={e => setTxObj({...txObj, to: e.target.value})}
              />
              <TextField
                id="outlined-basic"
                label="amount"
                variant="outlined"
                onChange={e => setTxObj({...txObj, amount: e.target.value})}
              />
            </DialogContent>
            <DialogActions>
              <Button variant="contained" onClick={() => addTransaction()}>
                Submit Transaction
              </Button>
              <Button variant="contained" onClick={handleSubTrx}>
                Close
              </Button>
            </DialogActions>
          </Dialog>
        </div>
      )}
    </>
  )
}

export default Trx
