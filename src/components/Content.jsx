import { useState, useEffect, useRef, useMemo } from 'react'
import NextImage from 'next/image'
import { Image, Link, Button, Input, Card, CardBody, Tabs, Tab, Select, SelectItem, Checkbox, Textarea, Accordion, AccordionItem, Code, Chip } from '@nextui-org/react'
import { ToastContainer, toast, Flip } from 'react-toastify'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { Transaction } from '@solana/web3.js'
import { FaGlobe, FaTelegramPlane, FaTwitter, FaDiscord, FaRedditAlien, FaGithub, FaRegCopy, FaCopy } from 'react-icons/fa'
import { FaMedium, FaImage } from 'react-icons/fa6'
import { FiUpload } from 'react-icons/fi'
import { TbHelp } from 'react-icons/tb'
import { Tooltip } from 'react-tooltip'
import { AiOutlineCloseCircle } from 'react-icons/ai'
import axios from 'axios'
import io from 'socket.io-client'
import { checkAddress, imagetoBase64, trimAddress } from '../utils/utils.js'
import logo from '../../public/logo.png'
import config from '../config.js'

export default function Content() {
  const { connection } = useConnection()
  const { publicKey: payer, sendTransaction, connected } = useWallet()

  const [name, setName] = useState('')
  const [symbol, setSymbol] = useState('')
  const [totalSupply, setTotalSupply] = useState(1000000000)
  const [decimals, setDecimals] = useState(9)
  const [tokenStandard, setTokenStandard] = useState('SPL Token')
  const [vanityKey, setVanityKey] = useState('')

  const [metadataState, setMetadataState] = useState('uploadMetadata')
  const [metadataUri, setMetadataUri] = useState('')
  const [website, setWebsite] = useState('')
  const [telegram, setTelegram] = useState('')
  const [twitter, setTwitter] = useState('')
  const [discord, setDiscord] = useState('')
  const [reddit, setReddit] = useState('')
  const [medium, setMedium] = useState('')
  const [github, setGithub] = useState('')
  const [description, setDescription] = useState('')
  const [tags, setTags] = useState([])
  const [tagInput, setTagInput] = useState('')
  const maxTags = 5
  const [metadataMutable, setMetadataMutable] = useState(true)

  const [mintAuthorityState, setMintAuthorityState] = useState(true)
  const [freezeAuthorityState, setFreezeAuthorityState] = useState(true)
  const [updateAuthorityState, setUpdateAuthorityState] = useState(true)

  const [mintAuthority, setMintAuthority] = useState(mintAuthorityState ? payer?.toString() : '')
  const [freezeAuthority, setFreezeAuthority] = useState(freezeAuthorityState ? payer?.toString() : '')
  const [updateAuthority, setUpdateAuthority] = useState(updateAuthorityState ? payer?.toString() : '')
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [tokenAddress, setTokenAddress] = useState(null)
  const [image, setImage] = useState(null)
  const imageRef = useRef(null)
  const [devnet, setDevnet] = useState(config.testWallets.includes(payer?.toString()))

  const isMintAuthorityInvalid = useMemo(() => mintAuthority?.trim() && !checkAddress(mintAuthority), [mintAuthority])
  const isFreezeAuthorityInvalid = useMemo(() => freezeAuthority?.trim() && !checkAddress(freezeAuthority), [freezeAuthority])
  const isUpdateAuthorityInvalid = useMemo(() => updateAuthority?.trim() && !checkAddress(updateAuthority), [updateAuthority])
  const isNameWarning = useMemo(() => name && name.length > 32, [name])
  const isSymbolWarning = useMemo(() => symbol && symbol.length > 10, [symbol])
  const isVanityKeyInvalid = useMemo(() => (vanityKey.length > 5 ? 'err' : /[\WIlO0]/.test(vanityKey) ? 'invalid' : vanityKey.length == 5 ? 'warn' : false), [vanityKey])

  useEffect(() => setDevnet(config.testWallets.includes(payer?.toString())), [payer, connected])
  useEffect(() => setMintAuthority(mintAuthorityState ? payer?.toString() : ''), [payer, connected, mintAuthorityState])
  useEffect(() => setFreezeAuthority(freezeAuthorityState ? payer?.toString() : ''), [payer, connected, freezeAuthorityState])
  useEffect(() => setUpdateAuthority(updateAuthorityState ? payer?.toString() : ''), [payer, connected, updateAuthorityState])

  async function createToken() {
    let err
    if (!connected || !payer) err = toast.error('Wallet not Connected')
    if (isMintAuthorityInvalid) err = toast.error('Invalid Mint Authority Address')
    if (isFreezeAuthorityInvalid) err = toast.error('Invalid Freeze Authority Address')
    if (isUpdateAuthorityInvalid) err = toast.error('Invalid Update Authority Address')
    if (totalSupply <= 0) err = toast.error('Invalid Supply')
    if (decimals < 0) err = toast.error('Invalid Decimals')
    if (['err', 'invalid'].includes(isVanityKeyInvalid)) err = toast.error('Invalid Vanity Key')
    if (tags.length > maxTags) err = toast.error(`Maximum ${maxTags} tags`)
    if (err) return

    setMintAuthorityState(Boolean(mintAuthority?.trim()))
    setFreezeAuthorityState(Boolean(freezeAuthority?.trim()))
    setUpdateAuthorityState(Boolean(updateAuthority?.trim()))
    setTags(tags.filter(Boolean))

    const data = {
      payer: payer.toString(),
      vanityKey,
      name,
      symbol,
      decimals,
      totalSupply,
      mintAuthority: mintAuthority ? mintAuthority?.trim() : undefined,
      freezeAuthority: freezeAuthority ? freezeAuthority?.trim() : undefined,
      updateAuthority: updateAuthority ? updateAuthority?.trim() : undefined,
      isToken2022: tokenStandard == 'Token 2022',
      metadataUri: metadataState != 'uploadMetadata' ? metadataUri?.trim() : undefined,
      metadata: metadataState == 'uploadMetadata' ? { imageData: await imagetoBase64(image)?.catch(() => {}), website, telegram, twitter, discord, reddit, medium, github, description, tags: tags.length ? tags : undefined } : undefined,
      metadataMutable,
      devnet,
    }
    Object.entries(data.metadata || {}).forEach(([k, v]) => !v && delete data.metadata[k])
    Object.keys(data.metadata || {}).length == 0 && (data.metadata = undefined)

    setLoading(true)
    setGenerating(Boolean(data.vanityKey))
    setUploading(Boolean(data.metadata))
    const socket = io(config.api)
    let mintId, sig, vanityErr
    try {
      socket.on(`generated:${payer.toString()}`, () => setGenerating(false))
      socket.on(`uploaded:${payer.toString()}`, () => setUploading(false))
      const response = await axios.request({ method: 'post', maxBodyLength: Infinity, url: `${config.api}/api`, headers: { 'Content-Type': 'application/json' }, data })
      mintId = response.data.mintId
      const { serializedTx } = response.data
      const transaction = Transaction.from(Buffer.from(serializedTx, 'hex'))
      sig = await sendTransaction(transaction, connection)
    } catch (e) {
      vanityErr = e.response?.data?.vanityErr
    }
    socket.disconnect()
    setGenerating(false)
    setUploading(false)
    setLoading(false)
    if (vanityErr) return toast.error('Failed to generate Vanity Key')
    if (!sig) return toast.error('Transaction Failed')

    setTokenAddress(null)
    await toast.promise(axios.get(`${config.api}/tx/confirm`, { params: { sig, devnet } }), {
      pending: 'Transaction Pending',
      error: 'Transaction Failed',
      success: {
        render: () => (
          <Link className="text-default-600" showAnchorIcon isExternal href={config.explorer(mintId, devnet)}>
            <span>
              View Token <Code className="bg-default-50 text-inherit">{trimAddress(mintId)}</Code>
            </span>
          </Link>
        ),
        autoClose: false,
      },
    })
    setTokenAddress(mintId)
  }

  return (
    <>
      <div className="px-2 py-3 text-center">
        <NextImage src={logo} height={75} alt="logo" className="mx-auto rounded-xl transition-all !duration-500 ease-in-out hover:scale-105" />
        <h1 className="pb-2 pt-4 text-2xl font-bold text-white md:text-4xl">Solana Token Launchpad</h1>
        <p className="text-gray-400 md:text-lg">Create a Token on the Solana Blockchain</p>
      </div>
      <div className="mx-auto mt-6 min-h-screen max-w-3xl px-2">
        <Card>
          <CardBody className="grid space-y-5 p-5 font-medium">
            <div className="grid grid-cols-2 gap-x-4 gap-y-5">
              <Input label="Name" classNames={{ input: 'placeholder:invisible', errorMessage: 'text-warning' }} placeholder="Name" labelPlacement="outside" value={name} onValueChange={setName} errorMessage={isNameWarning ? 'Name may be turncated in some places' : undefined} />
              <Input label="Symbol" classNames={{ input: 'placeholder:invisible', errorMessage: 'text-warning' }} placeholder="Symbol" labelPlacement="outside" value={symbol} onValueChange={setSymbol} errorMessage={isSymbolWarning ? 'Symbol may be turncated in some places' : undefined} />
              <Input type="number" label="Supply" classNames={{ input: 'placeholder:invisible' }} placeholder="Supply" labelPlacement="outside" value={totalSupply} onValueChange={setTotalSupply} min={1} isInvalid={totalSupply && totalSupply <= 0} errorMessage={totalSupply && totalSupply <= 0 ? 'Invalid Supply' : undefined} />
              <Input type="number" label="Decimals" classNames={{ input: 'placeholder:invisible' }} placeholder="Decimals" labelPlacement="outside" value={decimals} onValueChange={setDecimals} min={0} max={18} isInvalid={decimals && decimals < 0} errorMessage={decimals && decimals < 0 ? 'Invalid Decimals' : undefined} />
              <Select className="inline" label="Token Standard" labelPlacement="outside" selectedKeys={[tokenStandard]} onChange={e => e.target.value && setTokenStandard(e.target.value)}>
                <SelectItem key="SPL Token">SPL Token</SelectItem>
                <SelectItem key="Token 2022">Token 2022</SelectItem>
              </Select>
              <Input
                label={
                  <div className="flex items-center gap-x-2">
                    Vanity Key <TbHelp id="tooltip" className={`cursor-help rounded-2xl outline-none transition-all duration-75 ease-in-out ${['err', 'invalid'].includes(isVanityKeyInvalid) ? 'text-danger' : 'text-default-500 hover:text-default-700'}`} />
                  </div>
                }
                classNames={{ input: 'placeholder:invisible', errorMessage: ['err', 'invalid'].includes(isVanityKeyInvalid) ? 'text-danger' : isVanityKeyInvalid == 'warn' ? 'text-warning' : '' }}
                placeholder="Vanity Key"
                labelPlacement="outside"
                value={vanityKey}
                onValueChange={setVanityKey}
                isInvalid={['err', 'invalid'].includes(isVanityKeyInvalid)}
                errorMessage={isVanityKeyInvalid == 'err' ? 'Vanity Key is too long' : isVanityKeyInvalid == 'invalid' ? 'Vanity Key cannot contain I, l, O, 0 or special characters' : isVanityKeyInvalid == 'warn' ? 'Vanity Key may fail to generate' : undefined}
              />
              <Tooltip anchorSelect="#tooltip" clickable className="z-20 max-w-48 !rounded-2xl border border-content2 !bg-content1 !p-0 shadow-md drop-shadow-md" classNameArrow="!bg-content1 shadow-md drop-shadow-md border border-content2" opacity={100}>
                <div className="relative z-10 !rounded-2xl bg-content1 p-2 leading-relaxed">Vanity Key allows you to generate a custom token address starting with recognizable characters</div>
              </Tooltip>
            </div>
            <div className="grid gap-y-5">
              <Input
                label={
                  <Checkbox size="sm" isSelected={mintAuthorityState} onValueChange={setMintAuthorityState}>
                    Mint Authority
                  </Checkbox>
                }
                classNames={{ input: mintAuthorityState ? 'placeholder:invisible' : 'placeholder:focus-within:invisible', base: 'opacity-100' }}
                placeholder={mintAuthorityState ? 'Mint Authority' : 'Disabled'}
                isInvalid={isMintAuthorityInvalid}
                errorMessage={isMintAuthorityInvalid ? 'Invalid Address' : undefined}
                labelPlacement="outside"
                value={mintAuthority}
                onValueChange={setMintAuthority}
                isDisabled={!mintAuthorityState}
              />
              <Input
                label={
                  <Checkbox size="sm" isSelected={freezeAuthorityState} onValueChange={setFreezeAuthorityState}>
                    Freeze Authority
                  </Checkbox>
                }
                classNames={{ input: freezeAuthorityState ? 'placeholder:invisible' : 'placeholder:focus-within:invisible', base: 'opacity-100' }}
                placeholder={freezeAuthorityState ? 'Freeze Authority' : 'Disabled'}
                isInvalid={isFreezeAuthorityInvalid}
                errorMessage={isFreezeAuthorityInvalid ? 'Invalid Address' : undefined}
                labelPlacement="outside"
                value={freezeAuthority}
                onValueChange={setFreezeAuthority}
                isDisabled={!freezeAuthorityState}
              />
              <Input
                label={
                  <Checkbox size="sm" isSelected={updateAuthorityState} onValueChange={setUpdateAuthorityState}>
                    Update Authority
                  </Checkbox>
                }
                classNames={{ input: updateAuthorityState ? 'placeholder:invisible' : 'placeholder:focus-within:invisible', base: 'opacity-100' }}
                placeholder={updateAuthorityState ? 'Update Authority' : 'Disabled'}
                isInvalid={isUpdateAuthorityInvalid}
                errorMessage={isUpdateAuthorityInvalid ? 'Invalid Address' : undefined}
                labelPlacement="outside"
                value={updateAuthority}
                onValueChange={setUpdateAuthority}
                isDisabled={!updateAuthorityState}
              />
            </div>
            <div className="grid gap-y-5">
              <Tabs className="mx-auto" aria-label="Options" selectedKey={metadataState} onSelectionChange={setMetadataState} color="primary" fullWidth>
                <Tab key="uploadMetadata" title="Upload Metadata"></Tab>
                <Tab key="metadataUri" title="Metadata URI"></Tab>
              </Tabs>
            </div>
            {metadataState != 'uploadMetadata' ? (
              <div className="grid gap-y-5">
                <Input label="Metadata URI" classNames={{ input: 'placeholder:invisible' }} placeholder="Metadata URI" labelPlacement="outside" value={metadataUri} onValueChange={setMetadataUri} />
              </div>
            ) : (
              <>
                <div className="group mx-auto w-full cursor-pointer rounded-xl text-center text-sm" onClick={() => imageRef.current.click()}>
                  <input key={image} ref={imageRef} type="file" className="hidden" onChange={e => e.target?.files?.[0] && setImage(e.target?.files?.[0])} />
                  <div className={`flex flex-col items-center justify-center gap-3 rounded-xl py-6 ${image ? '' : 'bg-foreground-100 transition-all duration-75 ease-in-out group-hover:bg-foreground-200'}`}>
                    {image ? (
                      <>
                        <Image src={URL.createObjectURL(image)} alt="Image" className="max-h-72 rounded-xl" />
                        <div className="flex items-center gap-2 text-foreground-400 transition-all duration-75 ease-in-out group-hover:text-inherit">
                          <FaImage /> <span>{image?.name || 'Image'}</span> <AiOutlineCloseCircle className="cursor-pointer text-foreground-400 transition-all duration-75 ease-in-out hover:text-inherit" onMouseUp={() => setImage(null)} />
                        </div>
                      </>
                    ) : (
                      <>
                        <FiUpload className="text-4xl" />
                        <p>Upload Image</p>
                      </>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-5">
                  <Input label="Website" labelPlacement="outside" value={website} onValueChange={setWebsite} startContent={<FaGlobe className="text-foreground-600" />} />
                  <Input label="Telegram" labelPlacement="outside" value={telegram} onValueChange={setTelegram} startContent={<FaTelegramPlane className="text-foreground-600" />} />
                  <Input label="Twitter ( 𝕏 )" labelPlacement="outside" value={twitter} onValueChange={setTwitter} startContent={<FaTwitter className="text-foreground-600" />} />
                  <Input label="Discord" labelPlacement="outside" value={discord} onValueChange={setDiscord} startContent={<FaDiscord className="text-foreground-600" />} />
                </div>
                <Accordion isCompact className="p-0 text-sm font-medium" itemClasses={{ title: 'text-right text-sm text-foreground-400 hover:text-inherit transition-all duration-75 ease-in-out', trigger: 'p-0', content: 'pb-0' }}>
                  <AccordionItem key="more" aria-label="more" title="More">
                    <div className="grid gap-y-5">
                      <div className="grid grid-cols-2 gap-x-4 gap-y-5">
                        <Input label="Reddit" labelPlacement="outside" value={reddit} onValueChange={setReddit} startContent={<FaRedditAlien className="text-foreground-600" />} />
                        <Input label="Medium" labelPlacement="outside" value={medium} onValueChange={setMedium} startContent={<FaMedium className="text-foreground-600" />} />
                        <Input label="Github" labelPlacement="outside" value={github} onValueChange={setGithub} startContent={<FaGithub className="text-foreground-600" />} />
                        <div />
                      </div>
                      <Input
                        label="Tags"
                        labelPlacement="outside"
                        isInvalid={tags.length > maxTags}
                        errorMessage={tags.length > maxTags ? `Maximum ${maxTags} tags` : undefined}
                        value={tagInput}
                        onValueChange={setTagInput}
                        onKeyDown={e => e.key === 'Enter' && (setTagInput(''), tags.length <= maxTags && e.target.value.trim() && setTags([...tags, e.target.value]))}
                        onBlur={e => (setTagInput(''), tags.length <= maxTags && e.target.value.trim() && setTags([...tags, e.target.value]))}
                        classNames={{ innerWrapper: 'space-x-2' }}
                        startContent={tags?.map((tag, i) => (
                          <Chip key={i} className="ring-2 ring-default-100" onClose={() => setTags(tags.toSpliced(i, 1))} variant="flat">
                            {tag}
                          </Chip>
                        ))}
                      />
                    </div>
                  </AccordionItem>
                </Accordion>
                <Textarea maxRows={Infinity} label="Description" labelPlacement="outside" placeholder="Description" value={description} onValueChange={setDescription} classNames={{ input: 'resize-y placeholder:invisible' }} />
              </>
            )}
            <Checkbox className="py-0" size="sm" isSelected={metadataMutable} onValueChange={setMetadataMutable}>
              Metadata Mutable
            </Checkbox>
            {config.testWallets.includes(payer?.toString()) && (
              <Checkbox className="py-0" size="sm" isSelected={devnet} onValueChange={setDevnet}>
                Devnet
              </Checkbox>
            )}
            <Button type="submit" onPress={createToken} isLoading={loading} isDisabled={!connected} className={`${connected ? 'create-btn' : ''} min-w-fit bg-gradient-to-tr from-orange-700 to-orange-400 font-medium text-white shadow-lg ${loading ? 'cursor-progress' : ''}`}>
              {generating ? 'Generating Vanity Key' : uploading ? 'Uploading Metadata' : loading ? 'Creating Token' : 'Create Token'}
            </Button>
            {tokenAddress && (
              <div onClick={() => navigator.clipboard.writeText(tokenAddress).catch(() => {})} className="hover:default-600 active:default-600 group flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-success bg-success py-2 text-center text-sm font-bold text-black transition-all duration-75 ease-in-out hover:border-default-600 hover:bg-default-600 active:border-default-600 active:bg-default-600">
                <span>{tokenAddress}</span>
                <FaRegCopy className="group-active:hidden" />
                <FaCopy className="hidden group-active:block" />
              </div>
            )}
          </CardBody>
        </Card>
        <ToastContainer toastClassName="text-sm rounded-2xl border border-gray-600" position="bottom-right" theme="dark" transition={Flip} closeButton={false} autoClose={1500} newestOnTop hideProgressBar closeOnClick />
      </div>
    </>
  )
}
