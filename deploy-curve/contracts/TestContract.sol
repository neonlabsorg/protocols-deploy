// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "./interfaces/IERC20ForSPL.sol";
import "./interfaces/IMockCurve.sol";


contract TestContract {
    address public immutable MockCurve;
    address public immutable inputToken;
    address public immutable outputToken;
    uint public num;

    constructor(
        address _MockCurve,
        address _inputToken,
        address _outputToken
    ) {
        MockCurve = _MockCurve;
        inputToken = _inputToken;
        outputToken = _outputToken;
    }

    function exchange(
        uint amount,
        bytes32 account
    ) external {
        IERC20ForSPL(inputToken).approve(MockCurve, amount);

        uint256 outputAmount = IMockCurve(MockCurve).exchange(
            0,
            1,
            amount,
            amount
        );

        IERC20ForSPL(outputToken).transferSolana(account, uint64(outputAmount));
    }

    function increaseNum() external {
        num+=1;
    }
}