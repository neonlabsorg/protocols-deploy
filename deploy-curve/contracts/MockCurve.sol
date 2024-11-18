// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "./interfaces/IERC20ForSPL.sol";


contract MockCurve {
    address public immutable inputToken;
    address public immutable outputToken;
    
    constructor(
        address _inputToken,
        address _outputToken
    ) {
        inputToken = _inputToken;
        outputToken = _outputToken;
    }

    function exchange(
        int128 i,
        int128 j,
        uint256 _dx,
        uint256 _min_dy
    ) external returns (uint256) {
        IERC20ForSPL(inputToken).transferFrom(msg.sender, address(this), _dx);
        IERC20ForSPL(outputToken).transfer(msg.sender, _min_dy);

        return _min_dy;
    }
}