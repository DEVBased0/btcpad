import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import NextImage from 'next/image'
import { Image, Link, Button, Input, Card, CardBody, Tabs, Tab, Checkbox, Textarea, Accordion, AccordionItem, Spinner, Code, Chip } from '@nextui-org/react'
import { ToastContainer, toast, Flip } from 'react-toastify'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { PublicKey, Transaction } from '@solana/web3.js'
import { FaGlobe, FaTelegramPlane, FaTwitter, FaDiscord, FaRedditAlien, FaGithub } from 'react-icons/fa'
import { FaMedium, FaImage } from 'react-icons/fa6'
import { FiUpload } from 'react-icons/fi'
import { RiRefreshLine } from 'react-icons/ri'
import { AiOutlineCloseCircle } from 'react-icons/ai'
import axios from 'axios'
import io from 'socket.io-client'
import { checkAddress, imagetoBase64, trimAddress } from '../utils/utils.js'
import logo from '../../public/logo.png'
import config from '../config.js'

export default function Content() {
  const { connection } = useConnection()
  const { publicKey: payer, sendTransaction, connected } = useWallet()

  const [tokenAddress, setTokenAddress] = useState('')
  const [tokenInfo, setTokenInfo] = useState({})
  const [tokenInfoLoading, setTokenInfoLoading] = useState(false)

  const [name, setName] = useState('')
  const [symbol, setSymbol] = useState('')
  const [totalSupply, setTotalSupply] = useState('')
  const [decimals, setDecimals] = useState('')
  const [tokenStandard, setTokenStandard] = useState('')

  const [metadataState, setMetadataState] = useState('uploadMetadata')
  const [metadataUri, setMetadataUri] = useState('')
  const [website, setWebsite] = useState('')
  const [telegram, setTelegram] = useState('')
  const [twitter, setTwitter] = useState('')
  const [discord, setDiscord] = useState('')
  const [reddit, setReddit] = useState('')
  const [medium, setMedium] = useState('')
  const [github, setGithub] = useState('')
  const [tags, setTags] = useState([])
  const [tagInput, setTagInput] = useState('')
  const [maxTags, setMaxTags] = useState(5)
  const [description, setDescription] = useState('')
  const [metadataMutable, setMetadataMutable] = useState(false)

  const [mintAuthorityState, setMintAuthorityState] = useState(false)
  const [freezeAuthorityState, setFreezeAuthorityState] = useState(false)
  const [updateAuthorityState, setUpdateAuthorityState] = useState(false)
  const [freezeAccountState, setFreezeAccountState] = useState(new Set([]))

  const [mintAuthority, setMintAuthority] = useState('')
  const [freezeAuthority, setFreezeAuthority] = useState('')
  const [updateAuthority, setUpdateAuthority] = useState('')
  const [mintAmount, setMintAmount] = useState('')
  const [freezeAccount, setFreezeAccount] = useState('')
  const [thawAccount, setThawAccount] = useState('')
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [refresh, setRefresh] = useState(false)
  const [image, setImage] = useState(null)
  const imageRef = useRef(null)
  const [devnet, setDevnet] = useState(config.testWallets.includes(payer?.toString()))

  const mintId = useMemo(() => tokenAddress?.trim(), [tokenAddress])
  const isUpdatable = useMemo(() => payer?.toString() == tokenInfo.mintAuthority || payer?.toString() == tokenInfo.freezeAuthority || payer?.toString() == tokenInfo.updateAuthority, [tokenInfo, payer])
  const isNameWarning = useMemo(() => name && name.length > 32, [name])
  const isSymbolWarning = useMemo(() => symbol && symbol.length > 10, [symbol])
  const isTokenAddressInvalid = useMemo(() => mintId && !checkAddress(mintId), [mintId])
  const isMintAuthorityInvalid = useMemo(() => mintAuthority?.trim() && !checkAddress(mintAuthority), [mintAuthority])
  const isFreezeAuthorityInvalid = useMemo(() => freezeAuthority?.trim() && !checkAddress(freezeAuthority), [freezeAuthority])
  const isFreezeAccountInvalid = useMemo(() => freezeAccount?.trim() && !checkAddress(freezeAccount), [freezeAccount])
  const isThawAccountInvalid = useMemo(() => thawAccount?.trim() && !checkAddress(thawAccount), [thawAccount])
  const isUpdateAuthorityInvalid = useMemo(() => updateAuthority?.trim() && !checkAddress(updateAuthority), [updateAuthority])
  const isMetadataDisabled = useMemo(() => !tokenInfo.metadataMutable || payer?.toString() != tokenInfo.updateAuthority, [payer, tokenInfo])

  const getTokenInfo = useCallback(async () => {
    if (isTokenAddressInvalid) return
    if (!mintId) return setTokenInfo({})
    setTokenInfoLoading(true)
    const info = await axios.get(`${config.api}/info`, { params: { mint: mintId, devnet } }).catch(() => {})
    setTokenInfoLoading(false)
    if (!info?.data) return setTokenInfo({ err: true })
    setTokenInfo(info.data)
    const tokenInfo = info.data
    setName(tokenInfo.metadata?.name || tokenInfo.name)
    setSymbol(tokenInfo.metadata?.symbol || tokenInfo.symbol)
    setTotalSupply(Math.floor(tokenInfo.supply / 10 ** tokenInfo.decimals))
    setDecimals(tokenInfo.decimals)
    setTokenStandard(tokenInfo.tokenProgram)
    setMintAuthority(tokenInfo.mintAuthority)
    setMintAuthorityState(Boolean(tokenInfo.mintAuthority))
    setFreezeAuthority(tokenInfo.freezeAuthority)
    setFreezeAuthorityState(Boolean(tokenInfo.freezeAuthority))
    setUpdateAuthority(tokenInfo.updateAuthority != PublicKey.default.toString() ? tokenInfo.updateAuthority : null)
    setUpdateAuthorityState(Boolean(tokenInfo.updateAuthority && tokenInfo.updateAuthority != PublicKey.default.toString()))
    setMetadataUri(tokenInfo.metadataUri)
    setMetadataMutable(tokenInfo.metadataMutable)
    setWebsite(tokenInfo.metadata?.website)
    setTelegram(tokenInfo.metadata?.telegram)
    setTwitter(tokenInfo.metadata?.twitter)
    setDiscord(tokenInfo.metadata?.discord)
    setReddit(tokenInfo.metadata?.reddit)
    setMedium(tokenInfo.metadata?.medium)
    setGithub(tokenInfo.metadata?.github)
    setDescription(tokenInfo.metadata?.description)
    Array.isArray(tokenInfo.metadata?.tags) && setTags(tokenInfo.metadata?.tags), setMaxTags(max => Math.max(5, max))
    setImage(null)
    setMintAmount('')
    setFreezeAccount('')
    setThawAccount('')
    setFreezeAccountState(new Set([]))
  }, [isTokenAddressInvalid, mintId, devnet])

  useEffect(() => setDevnet(config.testWallets.includes(payer?.toString())), [payer, connected])
  useEffect(() => setMintAuthority(mintAuthorityState ? tokenInfo.mintAuthority : ''), [payer, connected, mintAuthorityState, tokenInfo])
  useEffect(() => setFreezeAuthority(freezeAuthorityState ? tokenInfo.freezeAuthority : ''), [payer, connected, freezeAuthorityState, tokenInfo])
  useEffect(() => setUpdateAuthority(updateAuthorityState ? tokenInfo.updateAuthority : ''), [payer, connected, updateAuthorityState, tokenInfo])
  useEffect(() => (getTokenInfo(), undefined), [getTokenInfo, mintId, isTokenAddressInvalid])

  async function updateToken() {
    let err
    if (!connected || !payer) err = toast.error('Wallet not Connected')
    if (!tokenInfo?.mint) err = toast.error('Token not Found')
    if (!isUpdatable) err = toast.error('Wallet not Authorized')
    if (!mintId || isTokenAddressInvalid || mintId != tokenInfo?.mint) err = toast.error('Invalid Token Address')
    if (isMintAuthorityInvalid) err = toast.error('Invalid Mint Authority Address')
    if (isFreezeAuthorityInvalid) err = toast.error('Invalid Freeze Authority Address')
    if (isUpdateAuthorityInvalid) err = toast.error('Invalid Update Authority Address')
    if (mintAmount < 0) err = toast.error('Invalid Mint Amount')
    if (freezeAccountState.size) {
      if (isFreezeAccountInvalid) err = toast.error('Invalid Freeze Account Address')
      if (isThawAccountInvalid) err = toast.error('Invalid Unfreeze Account Address')
    }
    if (tags.length > maxTags) err = toast.error(`Maximum ${maxTags} tags`)
    if (err) return

    setMintAuthorityState(Boolean(mintAuthority?.trim()))
    setFreezeAuthorityState(Boolean(freezeAuthority?.trim()))
    setUpdateAuthorityState(Boolean(updateAuthority?.trim()))
    !freezeAccount?.trim() && freezeAccountState.delete('freezeAccount')
    !thawAccount?.trim() && freezeAccountState.delete('thawAccount')
    setFreezeAccountState(freezeAccountState.size ? new Set(freezeAccountState) : new Set([]))
    setTags(tags.filter(Boolean))

    const uploadMetadata = image || name != tokenInfo.name || symbol != tokenInfo.symbol || website != tokenInfo.metadata?.website || telegram != tokenInfo.metadata?.telegram || twitter != tokenInfo.metadata?.twitter || discord != tokenInfo.metadata?.discord || reddit != tokenInfo.metadata?.reddit || medium != tokenInfo.metadata?.medium || github != tokenInfo.metadata?.github || description != tokenInfo.metadata?.description || tokenInfo.metadata?.tags.length !== tags.length || tokenInfo.metadata?.tags.some((v, i) => v !== tags[i])
    const data = {
      payer: payer.toString(),
      mintId: tokenInfo.mint,
      name: name != tokenInfo.name ? name : undefined,
      symbol: symbol != tokenInfo.symbol ? symbol : undefined,
      newMintAuthority: payer.toString() == tokenInfo.mintAuthority && payer.toString() != mintAuthority ? (!mintAuthorityState ? 'disable' : mintAuthority?.trim()) : undefined,
      newFreezeAuthority: payer.toString() == tokenInfo.freezeAuthority && payer.toString() != freezeAuthority ? (!freezeAuthorityState ? 'disable' : freezeAuthority?.trim()) : undefined,
      newUpdateAuthority: payer.toString() == tokenInfo.updateAuthority && payer.toString() != updateAuthority ? (!updateAuthorityState ? 'disable' : updateAuthority?.trim()) : undefined,
      newMetadataUri: metadataState != 'uploadMetadata' && !isMetadataDisabled && metadataUri?.trim() != tokenInfo.metadataUri ? metadataUri?.trim() : undefined,
      newMetadata: metadataState == 'uploadMetadata' && uploadMetadata && !isMetadataDisabled ? { imageData: await imagetoBase64(image), image: !image ? tokenInfo?.metadata?.image : undefined, website, telegram, twitter, discord, reddit, medium, github, description, tags: tags.length ? tags : undefined } : undefined,
      metadataMutable: metadataMutable !== tokenInfo.metadataMutable && !isMetadataDisabled ? metadataMutable : undefined,
      mintAmount: mintAmount > 0 ? mintAmount : undefined,
      freezeAccount: freezeAccountState.has('freezeAccount') && payer.toString() == tokenInfo.freezeAuthority && freezeAccount?.trim() ? freezeAccount?.trim() : undefined,
      thawAccount: freezeAccountState.has('thawAccount') && payer.toString() == tokenInfo.freezeAuthority && thawAccount?.trim() ? thawAccount?.trim() : undefined,
      devnet,
    }
    Object.entries(data.newMetadata || {}).forEach(([k, v]) => !v && delete data.newMetadata[k])
    Object.keys(data.newMetadata || {}).length == 0 && (data.newMetadata = undefined)
    if (data.newMintAuthority === undefined && data.newFreezeAuthority === undefined && data.newUpdateAuthority === undefined && data.newMetadataUri === undefined && data.newMetadata === undefined && data.metadataMutable === undefined && data.name === undefined && data.symbol === undefined && data.mintAmount === undefined && data.freezeAccount === undefined && data.thawAccount === undefined) return toast.error('No Changes Found')

    setLoading(true)
    setUploading(Boolean(data.newMetadata))
    const socket = io(config.api)
    let sig
    try {
      socket.on(`updated:${payer.toString()}`, () => setUploading(false))
      const response = await axios.request({ method: 'post', maxBodyLength: Infinity, url: `${config.api}/tools`, headers: { 'Content-Type': 'application/json' }, data })
      const { serializedTx } = response.data
      const transaction = Transaction.from(Buffer.from(serializedTx, 'hex'))
      sig = await sendTransaction(transaction, connection)
    } catch {}
    socket.disconnect()
    setUploading(false)
    if (!sig) return toast.error('Transaction Failed'), setLoading(false)

    await toast.promise(axios.get(`${config.api}/tx/confirm`, { params: { sig, devnet } }), {
      pending: 'Transaction Pending',
      error: 'Transaction Failed',
      success: {
        render: () => (
          <Link className="text-default-600" showAnchorIcon isExternal href={config.explorer(mintId, devnet)}>
            <span>
              Token Updated <Code className="bg-default-50 text-inherit">{trimAddress(mintId)}</Code>
            </span>
          </Link>
        ),
        autoClose: 15000,
      },
    })
    setRefresh(true)
    const confirmed = await axios
      .get(`${config.api}/tx/confirm`, { params: { sig, commitment: 'finalized', devnet } })
      .then(response => response.data)
      .catch(() => {})
    if (!confirmed) await new Promise(r => setTimeout(r, 15000))
    await getTokenInfo().catch(() => {})
    setLoading(false)
    setRefresh(false)
  }

  return (
    <>
      <div className="px-2 py-3 text-center">
        <NextImage src={logo} height={75} alt="logo" className="mx-auto rounded-xl transition-all !duration-500 ease-in-out hover:scale-105" />
        <h1 className="pb-2 pt-4 text-2xl font-bold text-white md:text-4xl">Solana Token Tools</h1>
        <p className="text-gray-400 md:text-lg">Update your Token on the Solana Blockchain</p>
      </div>
      <div className="mx-auto mt-6 min-h-screen max-w-3xl px-2">
        <Card>
          <CardBody className={`space-y-5 px-5 pt-5 font-medium transition-all duration-500 ease-in-out ${tokenInfo?.mint ? 'pb-5' : 'pb-11'} max-h-36 overflow-hidden`}>
            <Input
              label={isTokenAddressInvalid ? 'Token Address Invalid' : tokenInfo.err ? 'Token not Found' : 'Token Address'}
              classNames={{ input: 'placeholder:invisible' }}
              labelPlacement="outside"
              value={tokenAddress}
              onValueChange={setTokenAddress}
              isInvalid={isTokenAddressInvalid || tokenInfo.err}
              endContent={tokenInfoLoading ? <Spinner size="sm" color={isTokenAddressInvalid || tokenInfo.err ? 'danger' : 'primary'} /> : mintId && !isTokenAddressInvalid && <RiRefreshLine onClick={getTokenInfo} className="cursor-pointer text-lg text-default-500 transition-all duration-75 ease-in-out hover:rotate-[22deg] hover:text-default-700" />}
            />
            {config.testWallets.includes(payer?.toString()) && (
              <Checkbox className="py-0" size="sm" isSelected={devnet} onValueChange={setDevnet}>
                Devnet
              </Checkbox>
            )}
          </CardBody>
          <Accordion itemClasses={{ content: `p-0 ${tokenInfo.mint ? '' : 'hidden'}`, trigger: 'hidden' }} hideIndicator isCompact fullWidth className="p-0" selectedKeys={tokenInfo?.mint ? 'all' : undefined}>
            <AccordionItem aria-label="Token Info">
              <CardBody className="grid space-y-5 px-5 pb-5 pt-0 font-medium">
                <div className="grid grid-cols-2 gap-x-4 gap-y-5">
                  <Input isDisabled={isMetadataDisabled} label="Name" classNames={{ input: 'placeholder:invisible', errorMessage: 'text-warning' }} placeholder="Name" labelPlacement="outside" value={name} onValueChange={setName} errorMessage={!isMetadataDisabled && isNameWarning ? 'Name may be turncated in some places' : undefined} />
                  <Input isDisabled={isMetadataDisabled} label="Symbol" classNames={{ input: 'placeholder:invisible', errorMessage: 'text-warning' }} placeholder="Symbol" labelPlacement="outside" value={symbol} onValueChange={setSymbol} errorMessage={!isMetadataDisabled && isSymbolWarning ? 'Symbol may be turncated in some places' : undefined} />
                  <Input isDisabled type="number" label="Supply" classNames={{ input: 'placeholder:invisible' }} placeholder="Supply" labelPlacement="outside" value={totalSupply} />
                  <Input isDisabled type="number" label="Decimals" classNames={{ input: 'placeholder:invisible' }} placeholder="Decimals" labelPlacement="outside" value={decimals} />
                  <Input isDisabled label="Token Standard" classNames={{ input: 'placeholder:invisible' }} placeholder="Token Standard" labelPlacement="outside" value={tokenStandard} />
                  {payer?.toString() == tokenInfo.mintAuthority && connected && <Input label="Mint Tokens" placeholder="Mint Tokens" type="number" min={0} classNames={{ input: 'placeholder:invisible' }} isInvalid={mintAmount && mintAmount < 0} errorMessage={mintAmount && mintAmount < 0 ? 'Invalid Mint Amount' : undefined} labelPlacement="outside" value={mintAmount} onValueChange={setMintAmount} />}{' '}
                </div>
                <div className="grid gap-y-5">
                  <Input
                    label={
                      <Checkbox className="opacity-100" isDisabled={!connected || payer?.toString() != tokenInfo.mintAuthority} size="sm" isSelected={mintAuthorityState} onValueChange={setMintAuthorityState}>
                        Mint Authority
                      </Checkbox>
                    }
                    classNames={!connected || payer?.toString() != tokenInfo.mintAuthority ? { input: 'placeholder:text-inherit' } : { input: mintAuthorityState ? 'placeholder:invisible' : 'placeholder:focus-within:invisible', base: 'opacity-100' }}
                    placeholder={mintAuthorityState ? 'Mint Authority' : 'Disabled'}
                    isInvalid={isMintAuthorityInvalid}
                    errorMessage={isMintAuthorityInvalid ? 'Invalid Address' : undefined}
                    labelPlacement="outside"
                    value={mintAuthority}
                    onValueChange={setMintAuthority}
                    isDisabled={!mintAuthorityState || payer?.toString() != tokenInfo.mintAuthority}
                  />
                  <Input
                    label={
                      <Checkbox className="opacity-100" isDisabled={!connected || payer?.toString() != tokenInfo.freezeAuthority} size="sm" isSelected={freezeAuthorityState} onValueChange={setFreezeAuthorityState}>
                        Freeze Authority
                      </Checkbox>
                    }
                    classNames={!connected || payer?.toString() != tokenInfo.freezeAuthority ? { input: 'placeholder:text-inherit' } : { input: freezeAuthorityState ? 'placeholder:invisible' : 'placeholder:focus-within:invisible', base: 'opacity-100' }}
                    placeholder={freezeAuthorityState ? 'Freeze Authority' : 'Disabled'}
                    isInvalid={isFreezeAuthorityInvalid}
                    errorMessage={isFreezeAuthorityInvalid ? 'Invalid Address' : undefined}
                    labelPlacement="outside"
                    value={freezeAuthority}
                    onValueChange={setFreezeAuthority}
                    isDisabled={!freezeAuthorityState || payer?.toString() != tokenInfo.freezeAuthority}
                  />
                  {payer?.toString() == tokenInfo.freezeAuthority && connected && (
                    <Accordion isCompact className="space-y-2 p-0 text-sm font-medium" showDivider={false} selectionMode="multiple" selectedKeys={freezeAccountState} onSelectionChange={setFreezeAccountState} itemClasses={{ trigger: 'p-0 flex-row-reverse gap-x-2', content: 'pb-0' }}>
                      <AccordionItem key="freezeAccount" aria-label="Freeze Account" title="Freeze Account" classNames={{ title: `${freezeAccountState.has('freezeAccount') ? '' : 'text-foreground-400'} hover:text-inherit text-sm transition-all duration-75 ease-in-out`, content: `${freezeAccountState.size == 2 ? 'pb-3' : ''} transition-all duration-75 ease-in-out` }}>
                        <Input classNames={{ input: 'placeholder:invisible' }} isInvalid={isFreezeAccountInvalid} errorMessage={isFreezeAccountInvalid ? 'Invalid Address' : undefined} labelPlacement="outside" value={freezeAccount} onValueChange={setFreezeAccount} />
                      </AccordionItem>
                      <AccordionItem key="thawAccount" aria-label="Unfreeze Account" title="Unfreeze Account" classNames={{ title: `${freezeAccountState.has('thawAccount') ? '' : 'text-foreground-400'} hover:text-inherit text-sm transition-all duration-75 ease-in-out` }}>
                        <Input classNames={{ input: 'placeholder:invisible', label: '!text-warning-300' }} isInvalid={isThawAccountInvalid} errorMessage={isThawAccountInvalid ? 'Invalid Address' : undefined} labelPlacement="outside" value={thawAccount} onValueChange={setThawAccount} placeholder="Unfreeze Account" />
                      </AccordionItem>
                    </Accordion>
                  )}
                  <Input
                    label={
                      <Checkbox className="opacity-100" isDisabled={!connected || payer?.toString() != tokenInfo.updateAuthority} size="sm" isSelected={updateAuthorityState} onValueChange={setUpdateAuthorityState}>
                        Update Authority
                      </Checkbox>
                    }
                    classNames={!connected || payer?.toString() != tokenInfo.updateAuthority ? { input: 'placeholder:text-inherit' } : { input: updateAuthorityState ? 'placeholder:invisible' : 'placeholder:focus-within:invisible', base: 'opacity-100' }}
                    placeholder={updateAuthorityState ? 'Update Authority' : 'Disabled'}
                    isInvalid={isUpdateAuthorityInvalid}
                    errorMessage={isUpdateAuthorityInvalid ? 'Invalid Address' : undefined}
                    labelPlacement="outside"
                    value={updateAuthority}
                    onValueChange={setUpdateAuthority}
                    isDisabled={!updateAuthorityState || payer?.toString() != tokenInfo.updateAuthority}
                  />
                </div>
                {!isMetadataDisabled && (
                  <div className="grid gap-y-5">
                    <Tabs className="mx-auto" aria-label="Options" selectedKey={metadataState} onSelectionChange={setMetadataState} color="primary" fullWidth>
                      <Tab key="uploadMetadata" title="Upload Metadata"></Tab>
                      <Tab key="metadataUri" title="Metadata URI"></Tab>
                    </Tabs>
                  </div>
                )}
                {(isMetadataDisabled || metadataState != 'uploadMetadata') && (
                  <div className="grid gap-y-5">
                    <Input isDisabled={isMetadataDisabled} label="Metadata URI" classNames={{ input: 'placeholder:invisible' }} placeholder="Metadata URI" labelPlacement="outside" value={metadataUri} onValueChange={setMetadataUri} />
                  </div>
                )}
                {(isMetadataDisabled || metadataState == 'uploadMetadata') && (
                  <>
                    <div className={`group mx-auto w-full rounded-xl text-center text-sm ${isMetadataDisabled ? '' : 'cursor-pointer'}`} onClick={() => imageRef.current.click()}>
                      <input disabled={isMetadataDisabled} key={image} ref={imageRef} type="file" className="hidden" onChange={e => e.target?.files?.[0] && setImage(e.target?.files?.[0])} />
                      <div className={`flex flex-col items-center justify-center gap-3 rounded-xl py-6 ${image || tokenInfo?.metadata?.image ? '' : `${isMetadataDisabled ? 'opacity-disabled' : 'transition-all duration-75 ease-in-out group-hover:bg-foreground-200'} bg-foreground-100`}`}>
                        {image || tokenInfo?.metadata?.image ? (
                          <>
                            <Image src={image ? URL.createObjectURL(image) : tokenInfo?.metadata?.image} alt="Image" className="max-h-72 rounded-xl" />
                            <div className={`flex items-center gap-2 ${isMetadataDisabled ? 'opacity-disabled' : 'text-foreground-400 transition-all duration-75 ease-in-out group-hover:text-inherit'}`}>
                              <FaImage /> <span>{image?.name || isMetadataDisabled ? 'Image' : 'Change Image'}</span> {image && <AiOutlineCloseCircle className="cursor-pointer text-foreground-400 transition-all duration-75 ease-in-out hover:text-inherit" onMouseUp={() => setImage(null)} />}
                            </div>
                          </>
                        ) : (
                          <>
                            {isMetadataDisabled ? <FaImage className="text-4xl" /> : <FiUpload className="text-4xl" />}
                            <span>{isMetadataDisabled ? 'Image' : 'Upload Image'}</span>
                          </>
                        )}
                      </div>
                    </div>
                    {(!isMetadataDisabled || website || telegram || twitter || discord || reddit || medium || github) && (
                      <>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-5">
                          <Input isDisabled={isMetadataDisabled} label="Website" labelPlacement="outside" value={website} onValueChange={setWebsite} startContent={<FaGlobe className="text-foreground-600" />} />
                          <Input isDisabled={isMetadataDisabled} label="Telegram" labelPlacement="outside" value={telegram} onValueChange={setTelegram} startContent={<FaTelegramPlane className="text-foreground-600" />} />
                          <Input isDisabled={isMetadataDisabled} label="Twitter ( 𝕏 )" labelPlacement="outside" value={twitter} onValueChange={setTwitter} startContent={<FaTwitter className="text-foreground-600" />} />
                          <Input isDisabled={isMetadataDisabled} label="Discord" labelPlacement="outside" value={discord} onValueChange={setDiscord} startContent={<FaDiscord className="text-foreground-600" />} />
                        </div>
                        <Accordion isCompact className="p-0 text-sm font-medium" itemClasses={{ title: 'text-right text-sm text-foreground-400 hover:text-inherit transition-all duration-75 ease-in-out', trigger: 'p-0', content: 'pb-0' }}>
                          <AccordionItem key="more" aria-label="more" title="More">
                            <div className="grid gap-y-5">
                              <div className="grid grid-cols-2 gap-x-4 gap-y-5">
                                <Input isDisabled={isMetadataDisabled} label="Reddit" labelPlacement="outside" value={reddit} onValueChange={setReddit} startContent={<FaRedditAlien className="text-foreground-600" />} />
                                <Input isDisabled={isMetadataDisabled} label="Medium" labelPlacement="outside" value={medium} onValueChange={setMedium} startContent={<FaMedium className="text-foreground-600" />} />
                                <Input isDisabled={isMetadataDisabled} label="Github" labelPlacement="outside" value={github} onValueChange={setGithub} startContent={<FaGithub className="text-foreground-600" />} />
                                <div />
                              </div>
                              <Input
                                isDisabled={isMetadataDisabled}
                                label="Tags"
                                labelPlacement="outside"
                                isInvalid={!isMetadataDisabled && tags.length > maxTags}
                                errorMessage={!isMetadataDisabled && tags.length > maxTags ? `Maximum ${maxTags} tags` : undefined}
                                value={tagInput}
                                onValueChange={setTagInput}
                                onKeyDown={e => e.key === 'Enter' && (setTagInput(''), tags.length <= maxTags && e.target.value.trim() && setTags([...tags, e.target.value]))}
                                onBlur={e => (setTagInput(''), tags.length <= maxTags && e.target.value.trim() && setTags([...tags, e.target.value]))}
                                classNames={{ innerWrapper: 'space-x-2' }}
                                startContent={tags?.map((tag, i) => (
                                  <Chip key={i} className="ring-2 ring-default-100" onClose={isMetadataDisabled ? undefined : () => setTags(tags.toSpliced(i, 1))} variant="flat">
                                    {tag}
                                  </Chip>
                                ))}
                              />
                            </div>
                          </AccordionItem>
                        </Accordion>
                      </>
                    )}
                    <Textarea isDisabled={isMetadataDisabled} maxRows={Infinity} label="Description" labelPlacement="outside" placeholder="Description" value={description} onValueChange={setDescription} classNames={{ input: `placeholder:invisible ${isMetadataDisabled ? '' : 'resize-y'}` }} />
                  </>
                )}
                <Checkbox isDisabled={isMetadataDisabled} className="py-0" size="sm" isSelected={metadataMutable} onValueChange={setMetadataMutable}>
                  Metadata Mutable
                </Checkbox>
                <Button type="submit" onPress={updateToken} isLoading={loading} isDisabled={!connected || !isUpdatable || !tokenInfo?.mint} className={`${connected ? 'update-btn' : ''} min-w-fit bg-gradient-to-tr from-orange-600 to-stone-400 font-medium text-white shadow-lg ${loading ? 'cursor-progress' : ''}`}>
                  {uploading ? 'Updating Metadata' : refresh ? 'Refreshing Token' : loading ? 'Updating Token' : 'Update Token'}
                </Button>
              </CardBody>
            </AccordionItem>
          </Accordion>
        </Card>
        <ToastContainer toastClassName="text-sm rounded-2xl border border-gray-600" position="bottom-right" theme="dark" transition={Flip} closeButton={false} autoClose={1500} newestOnTop hideProgressBar closeOnClick />
      </div>
    </>
  )
}
