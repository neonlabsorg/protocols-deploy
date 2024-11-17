// SPDX-License-Identifier: MIT

pragma solidity 0.8.28;
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";
import "./interfaces/IERC20ForSPL.sol";
import "./precompiles/ICallSolana.sol";
import "./precompiles/QueryAccount.sol";
import "./utils/CallSolanaHelperLib.sol";
import "./utils/SolanaDataConverterLib.sol";


/// @title ERC4626Raydium
/// @author https://twitter.com/mnedelchev_
/// @notice This contract demonstrates how to deposit and withdraw liquidity to Raydium's program on Solana from a Solidity smart contract.
contract ERC4626Raydium is Ownable, ERC4626 {
    using SolanaDataConverterLib for *;
    using Math for uint256;
    
    ICallSolana public constant CALL_SOLANA = ICallSolana(0xFF00000000000000000000000000000000000006);
    bytes32 public constant TOKEN_PROGRAM = 0x06ddf6e1d765a193d9cbe146ceeb79ac1cb485ed5f5b37913a8cf5857eff00a9;
    bytes32 public constant ASSOCIATED_TOKEN_PROGRAM = 0x8c97258f4e2489f1bb3d1029148e0d830b5a1399daff1084048e7bd8dbe9f859;
    bytes32 public constant RAYDIUM_SOL_USDC_LP_TOKEN = 0x6c4f93d858e88ffafea08c43674497e8e6a932c0c83148262a1ae3ccc7829ec6;
    bytes32 public constant RAYDIUM_SOL_USDC_POOL = 0x3d6e472e67a46ea6b4bd0bab9dfd35e2b4c72f1d6d59c2eab95c942573ad22f1;
    bytes32 public constant RAYDIUM_SOL_USDC_POOL_QUOTE = 0xf2cbb9b760eddb185706303063ad33d7b57296ea02d4e0335e31ceafa4cc42dd;
    bytes32 public constant RAYDIUM_SOL_USDC_POOL_BASE = 0xb870e12dd379891561d2e9fa8f26431834eb736f2f24fc2a2a4dff1fd5dca4df;

    // Solana account data offsets
    uint private ATA_AMOUNT_OFFSET = 64;
    uint private MINT_TOTAL_SUPPLY_OFFSET = 2592;
    uint private AVAILABLE_AMOUNT_OFFSET = 224;
    uint private BORROWED_AMOUNT_SF_OFFSET = 240;
    uint private ACCUMULATED_PROTOCOL_FEES_SF_OFFSET = 352;
    uint private ACCUMULATED_REFERRER_FEES_SF_OFFSET = 368;
    uint private PENDING_REFERRER_FEES_SF_OFFSET = 384;

    constructor(
        IERC20 _token
    ) Ownable(msg.sender) ERC20("NEON EVM Vault Token", "NVT") ERC4626(_token) {}

    event CallSolanaResponse(bytes response);

    /// @notice Request to reading data from Solana account has failed.
    error FailedQueryAccountRequest(bytes32 account);

    function getNeonAddress(address evm_address) public view returns(bytes32) {
        return CALL_SOLANA.getNeonAddress(evm_address);
    }

    function totalAssets() public view virtual override returns (uint256) {
        uint _totalAssets = IERC20(asset()).balanceOf(address(this));
        uint scale = 10 ** 10;

        // get estimated token A & B
        bytes32 USDC_SOL_LP_ATA = CALL_SOLANA.getSolanaPDA(
            ASSOCIATED_TOKEN_PROGRAM,
            CallSolanaHelperLib.getAssociateTokenAccountSeeds(
                CALL_SOLANA.getNeonAddress(address(this)),
                TOKEN_PROGRAM,
                RAYDIUM_SOL_USDC_LP_TOKEN
            )
        );
        (bool success, bytes memory data) = QueryAccount.data(uint256(USDC_SOL_LP_ATA), 0, 165);
        require(success, FailedQueryAccountRequest(USDC_SOL_LP_ATA));
        
        uint64 USDC_SOL_LP_Balance = (data.toUint64(ATA_AMOUNT_OFFSET)).readLittleEndianUnsigned64();
        if (USDC_SOL_LP_Balance > 0) {
            (success, data) = QueryAccount.data(uint256(RAYDIUM_SOL_USDC_POOL), 0, 752);
            require(success, FailedQueryAccountRequest(RAYDIUM_SOL_USDC_POOL));
            uint64 lpReserve = (data.toUint64(720)).readLittleEndianUnsigned64();

            (success, data) = QueryAccount.data(uint256(RAYDIUM_SOL_USDC_POOL_QUOTE), 0, 165);
            require(success, FailedQueryAccountRequest(RAYDIUM_SOL_USDC_POOL_QUOTE));
            uint64 quoteReserve = (data.toUint64(ATA_AMOUNT_OFFSET)).readLittleEndianUnsigned64();

            (success, data) = QueryAccount.data(uint256(RAYDIUM_SOL_USDC_POOL_BASE), 0, 165);
            require(success, FailedQueryAccountRequest(RAYDIUM_SOL_USDC_POOL_BASE));
            uint64 baseReserve = (data.toUint64(ATA_AMOUNT_OFFSET)).readLittleEndianUnsigned64();

            uint estimatedTokenAAmount = ((USDC_SOL_LP_Balance * scale) / lpReserve * quoteReserve) / scale; // USDC
            // uint estimatedTokenBAmount = ((USDC_SOL_LP_Balance * scale) / lpReserve * baseReserve) / scale; // SOL

            // get estimation of swap USDC -> SOL
            uint fees = (estimatedTokenAAmount * 25) / 10000;
            uint amount_in_with_fee = estimatedTokenAAmount - fees;
            uint amountOutRaw = (baseReserve * amount_in_with_fee) / (quoteReserve + amount_in_with_fee);
            _totalAssets+= amountOutRaw;
        }

        return _totalAssets;
    }

    /* function _convertToShares(uint256 assets, Math.Rounding rounding) internal view virtual override returns (uint256) {
        uint totalAssets = totalAssets() + 1;
        uint scale = 10 ** 10;

        // get contract's cUSDC ATA balance
        bytes32 cUSDC_ATA = CALL_SOLANA.getSolanaPDA(
            ASSOCIATED_TOKEN_PROGRAM,
            CallSolanaHelperLib.getAssociateTokenAccountSeeds(
                CALL_SOLANA.getNeonAddress(address(this)),
                TOKEN_PROGRAM,
                Raydium_cUSDC
            )
        );

        (bool success, bytes memory data) = QueryAccount.data(uint256(cUSDC_ATA), 0, 165);
        require(success, FailedQueryAccountRequest(cUSDC_ATA));
        
        uint64 cUSDCBalance = (data.toUint64(ATA_AMOUNT_OFFSET)).readLittleEndianUnsigned64();
        if (cUSDCBalance > 0) {
            (uint mintTotalSupply, uint totalSupply) = getRaydiumUSDCcUSDCExchangeRate();

            totalAssets+= (cUSDCBalance * scale) / ((mintTotalSupply * scale) / totalSupply);
        }

        return assets.mulDiv(
            totalSupply() + 10 ** _decimalsOffset(), 
            totalAssets,
            rounding
        );
    }

    function _convertToAssets(uint256 shares, Math.Rounding rounding) internal view virtual override returns (uint256) {
        uint totalAssets = totalAssets() + 1;
        uint scale = 10 ** 10;

        // get contract's cUSDC ATA balance
        bytes32 cUSDC_ATA = CALL_SOLANA.getSolanaPDA(
            ASSOCIATED_TOKEN_PROGRAM,
            CallSolanaHelperLib.getAssociateTokenAccountSeeds(
                CALL_SOLANA.getNeonAddress(address(this)),
                TOKEN_PROGRAM,
                Raydium_cUSDC
            )
        );

        (bool success, bytes memory data) = QueryAccount.data(uint256(cUSDC_ATA), 0, 165);
        require(success, FailedQueryAccountRequest(cUSDC_ATA));
        
        uint64 cUSDCBalance = (data.toUint64(ATA_AMOUNT_OFFSET)).readLittleEndianUnsigned64();
        if (cUSDCBalance > 0) {
            (uint mintTotalSupply, uint totalSupply) = getRaydiumUSDCcUSDCExchangeRate();

            totalAssets+= (cUSDCBalance * scale) / ((mintTotalSupply * scale) / totalSupply);
        }

        return shares.mulDiv(
            totalAssets,
            totalSupply() + 10 ** _decimalsOffset(), 
            rounding
        );
    } */

    function depositToSolana(
        uint64 amount,
        bytes[] calldata instructionsData
    ) external onlyOwner {
        // transfer the tokens from the contract's arbitrary Token account to contract's ATA account
        IERC20ForSPL(asset()).transferSolana(
            CALL_SOLANA.getSolanaPDA(
                ASSOCIATED_TOKEN_PROGRAM,
                CallSolanaHelperLib.getAssociateTokenAccountSeeds(
                    CALL_SOLANA.getNeonAddress(address(this)),
                    TOKEN_PROGRAM,
                    IERC20ForSPL(asset()).tokenMint()
                )
            ),
            amount
        );
        
        // swap
        _executeComposabilityRequest(0, instructionsData[0]);
        
        // deposit LP
        _executeComposabilityRequest(0, instructionsData[1]);
    }

    function executeComposabilityRequest(
        uint64[] calldata lamports,
        bytes[] calldata instructionsData
    ) external onlyOwner {
        for (uint i = 0; i < instructionsData.length; ++i) {
            _executeComposabilityRequest(lamports[i], instructionsData[i]);
        }
    }

    function withdrawFromSolana(
        bytes[] calldata instructionsData
    ) external onlyOwner {
        // withdraw LP
        _executeComposabilityRequest(0, instructionsData[0]);
        
        // swap
        _executeComposabilityRequest(0, instructionsData[1]);
        
        // transfer the tokens from the contract's ATA account to the contract's arbitrary Token account
        _executeComposabilityRequest(0, instructionsData[2]);
    }

    function _executeComposabilityRequest(
        uint64 lamports,
        bytes calldata instructionData
    ) public {
        bytes memory response = CALL_SOLANA.execute(
            lamports,
            instructionData
        );
        
        emit CallSolanaResponse(response);
    }
}