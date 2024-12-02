// SPDX-License-Identifier: MIT

pragma solidity 0.8.28;
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ERC4626, ERC20} from "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";
import {IERC20ForSPL} from "./interfaces/IERC20ForSPL.sol";
import {ICallSolana} from "./precompiles/ICallSolana.sol";
import {QueryAccount} from "./precompiles/QueryAccount.sol";
import {CallSolanaHelperLib} from "./utils/CallSolanaHelperLib.sol";
import {SolanaDataConverterLib} from "./utils/SolanaDataConverterLib.sol";


/// @title ERC4626Kamino
/// @author https://twitter.com/mnedelchev_
/// @notice This contract demonstrates how to deposit and withdraw liquidity to Kamino's program on Solana from a Solidity smart contract.
contract ERC4626Kamino is Ownable, ERC4626 {
    using SolanaDataConverterLib for *;
    using Math for uint256;
    
    ICallSolana public constant CALL_SOLANA = ICallSolana(0xFF00000000000000000000000000000000000006);
    bytes32 public constant TOKEN_PROGRAM = 0x06ddf6e1d765a193d9cbe146ceeb79ac1cb485ed5f5b37913a8cf5857eff00a9;
    bytes32 public constant ASSOCIATED_TOKEN_PROGRAM = 0x8c97258f4e2489f1bb3d1029148e0d830b5a1399daff1084048e7bd8dbe9f859;
    bytes32 public constant KAMINO_cUSDC = 0x967fb3b7585eb44337656bd01603bb5579d54770b9d40b1eae4c0cc3a80c6ddc;
    bytes32 public constant KAMINO_RESERVE_USDC = 0xb3ca896fdd9e7319a26e06cdf9ad5fee4e23f249bb4067c89d5b602acd22e06c;

    // Solana account data offsets
    uint private ATA_AMOUNT_OFFSET = 64;
    uint private MINT_TOTAL_SUPPLY_OFFSET = 2592;
    uint private AVAILABLE_AMOUNT_OFFSET = 224;
    uint private BORROWED_AMOUNT_SF_OFFSET = 240;
    uint private ACCUMULATED_PROTOCOL_FEES_SF_OFFSET = 352;
    uint private ACCUMULATED_REFERRER_FEES_SF_OFFSET = 368;
    uint private PENDING_REFERRER_FEES_SF_OFFSET = 384;

    constructor(IERC20 _token) Ownable(msg.sender) ERC20("NEON EVM Vault Token", "NVT") ERC4626(_token) {}

    event CallSolanaResponse(bytes response);

    /// @notice Request to reading data from Solana account has failed.
    error FailedQueryAccountRequest(bytes32 account);

    function getNeonAddress(address evm_address) public view returns(bytes32) {
        return CALL_SOLANA.getNeonAddress(evm_address);
    }

    function totalAssets() public view virtual override returns (uint256) {
        uint _totalAssets = IERC20(asset()).balanceOf(address(this));

        // get contract's cUSDC ATA balance
        bytes32 cUSDC_ATA = CALL_SOLANA.getSolanaPDA(
            ASSOCIATED_TOKEN_PROGRAM,
            CallSolanaHelperLib.getAssociateTokenAccountSeeds(
                CALL_SOLANA.getNeonAddress(address(this)),
                TOKEN_PROGRAM,
                KAMINO_cUSDC
            )
        );

        (bool success, bytes memory data) = QueryAccount.data(uint256(cUSDC_ATA), 0, 165);
        require(success, FailedQueryAccountRequest(cUSDC_ATA));
        
        uint64 cUSDCBalance = (data.toUint64(ATA_AMOUNT_OFFSET)).readLittleEndianUnsigned64();
        if (cUSDCBalance > 0) {
            uint scale = 10 ** 10;
            (uint mintTotalSupply, uint totalSupply) = getKaminoUSDCcUSDCExchangeRate();

            _totalAssets+= (cUSDCBalance * scale) / ((mintTotalSupply * scale) / totalSupply);
        }
        return _totalAssets;
    }

    // calculate Kamino's cUSDC <=> USDC exchange rate
    function getKaminoUSDCcUSDCExchangeRate() public view returns(uint, uint) {
        (bool success, bytes memory data) = QueryAccount.data(uint256(KAMINO_RESERVE_USDC), 0, 2600); // 8624 is the full size
        require(success, FailedQueryAccountRequest(KAMINO_RESERVE_USDC));

        uint64 mintTotalSupply = (data.toUint64(MINT_TOTAL_SUPPLY_OFFSET)).readLittleEndianUnsigned64();
        uint64 availableAmount = (data.toUint64(AVAILABLE_AMOUNT_OFFSET)).readLittleEndianUnsigned64();
        uint128 borrowedAmountSf = (data.toUint64(BORROWED_AMOUNT_SF_OFFSET)).readLittleEndianUnsigned128();
        if (borrowedAmountSf > 0) {
            borrowedAmountSf = borrowedAmountSf / 2 ** 60;
        }
        uint128 accumulatedProtocolFeesSf = (data.toUint64(ACCUMULATED_PROTOCOL_FEES_SF_OFFSET)).readLittleEndianUnsigned128();
        if (accumulatedProtocolFeesSf > 0) {
            accumulatedProtocolFeesSf = accumulatedProtocolFeesSf / 2 ** 60;
        }
        uint128 accumulatedReferrerFeesSf = (data.toUint64(ACCUMULATED_REFERRER_FEES_SF_OFFSET)).readLittleEndianUnsigned128();
        if (accumulatedReferrerFeesSf > 0) {
            accumulatedReferrerFeesSf = accumulatedReferrerFeesSf / 2 ** 60;
        }
        uint128 pendingReferrerFeesSf = (data.toUint64(PENDING_REFERRER_FEES_SF_OFFSET)).readLittleEndianUnsigned128();
        if (pendingReferrerFeesSf > 0) {
            pendingReferrerFeesSf = pendingReferrerFeesSf / 2 ** 60;
        }

        return(
            mintTotalSupply, 
            availableAmount + borrowedAmountSf + accumulatedProtocolFeesSf + accumulatedReferrerFeesSf + pendingReferrerFeesSf
        );
    }

    function depositToSolana(
        uint64 amount,
        bytes calldata instructionData
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

        _executeComposabilityRequest(0, instructionData);
    }

    function withdrawFromSolana(
        bytes[] calldata instructionsData
    ) external onlyOwner {
        for (uint i = 0; i < instructionsData.length; ++i) {
            _executeComposabilityRequest(0, instructionsData[i]);
        }
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