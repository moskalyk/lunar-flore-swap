import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

library ECRecovery {

  /**
   * @dev Recover signer address from a message by using his signature
   * @param hash bytes32 message, the hash is the signed message. What is recovered is the signer address.
   * @param sig bytes signature, the signature is generated using web3.eth.sign()
   */
  function recover(bytes32 hash, bytes memory sig) public pure returns (address) {
    bytes32 r;
    bytes32 s;
    uint8 v;

    //Check the signature length
    if (sig.length != 65) {
      return (address(0));
    }

    // Divide the signature in r, s and v variables
    assembly {
      r := mload(add(sig, 32))
      s := mload(add(sig, 64))
      v := byte(0, mload(add(sig, 96)))
    }

    // Version of signature should be 27 or 28, but 0 and 1 are also possible versions
    if (v < 27) {
      v += 27;
    }

    // If the version is correct return the signer address
    if (v != 27 && v != 28) {
      return (address(0));
    } else {
      return ecrecover(hash, v, r, s);
    }
  }

}

contract FloreSwap {

    using ECDSA for bytes32;
    using ECRecovery for bytes32;

    enum SwapDuration { DAY, WEEK, EEK, MOON }

    // Address of the custom ERC20 token and USDC contracts on Polygon
    address public floreAddress;
    address public baseAddress;
    uint public baseDecibals;

    // restrictions (time + quantity) ~> (space + quality)
    uint256 public maxSwapAmount = 100 * 10**6;
    uint256 public swapPeriod = 1 days;
    mapping(address => uint256) public lastSwapTime;
    mapping(address => uint256) public swappedAmount;

    // Address of the contract owner
    address public owner;
    address public prover;

    // Constructor to set the token addresses and contract owner
    constructor(address _prover, address _usdcAddress, address _floreTokenAddress) {
        prover = _prover;
        floreAddress = _floreTokenAddress;
        baseAddress = _usdcAddress;
        owner = msg.sender;
        baseDecibals = 6;
    }

    // Function to allow the contract owner to update the base swap
    function updateBase(address _baseCurrency, uint _baseDecimals) external {
        require(msg.sender == owner, "Only the owner can update base");
        baseAddress = _baseCurrency;
        baseDecibals = _baseDecimals;
    }

    // Function to allow the contract owner to update the lunar prover address
    function updateProver(address _prover) external {
        require(msg.sender == owner, "Only the owner can update base");
        prover = _prover;
    }

    // Function to allow the contract owner to withdraw any accidentally sent ERC20 tokens
    function withdrawTokens(address tokenAddress, uint256 amount) external {
        require(msg.sender == owner, "Only the owner can withdraw tokens");
        IERC20(tokenAddress).transfer(owner, amount);
    }

    // Function to allow the contract owner to withdraw any accidentally sent ERC20 tokens
    function withdrawBase(uint256 amount) external {
        require(msg.sender == owner, "Only the owner can withdraw tokens");
        IERC20(baseAddress).transfer(owner, amount);
    }

    function calculateAllowedSwapAmount(address user) public view returns (uint256) {
        uint256 currentTime = block.timestamp;
        uint256 lastSwapTimestamp = lastSwapTime[user];
        uint256 elapsedTime = currentTime - lastSwapTimestamp;

        // Calculate the allowed swap amount based on the elapsed time since the last swap
        uint256 allowedAmount = (elapsedTime * maxSwapAmount) / swapPeriod;
        if (allowedAmount > maxSwapAmount) {
            allowedAmount = maxSwapAmount;
        }

        // Ensure that the user does not exceed the maximum swap amount
        uint256 remainingAmount = maxSwapAmount - swappedAmount[user];
        if (allowedAmount > remainingAmount) {
            allowedAmount = remainingAmount;
        }

        return allowedAmount;
    }

    // Function to perform the token swap (note: requires approval of token)
    function swapTokens(uint256 amount, uint blockNumber, uint price, bytes memory xProof) external {
        require(blockNumber < (block.number + 50), "Stale Signature");
        bytes32 message = keccak256(abi.encodePacked(price, blockNumber, msg.sender, baseAddress));
        bytes32 preFixedMessage = message.toEthSignedMessageHash();
        require(prover == ECRecovery.recover(preFixedMessage, xProof), "Invalid Proof");

        // calculate allowed amount in timespan
        uint256 allowedAmount = calculateAllowedSwapAmount(msg.sender);

        // does not exceed allowed amount
        require(amount <= allowedAmount, "Exceeded maximum allowed swap amount.");

        // Update the last swap time for the user
        lastSwapTime[msg.sender] = block.timestamp;

        // Update the total amount swapped by the user
        swappedAmount[msg.sender] += amount;

        // Ensure the contract has enough custom ERC20 tokens to swap
        IERC20 flore = IERC20(floreAddress);
        require(flore.balanceOf(msg.sender) >= amount, "Insufficient custom tokens in the contract");
        
        // Transfer the custom tokens from the contract to this contract's caller
        flore.transferFrom(msg.sender, address(this), amount);
        IERC20 base = IERC20(baseAddress);
        require(base.balanceOf(address(this)) >= amount / price * 10**baseDecibals, "Insufficient Base Token for Transfer");
        base.transfer(msg.sender, amount / price * 10**baseDecibals);
    }

    function compass(SwapDuration duration, uint _maxSwapAmount) external {
        require(msg.sender == owner, "Only the owner can change the compass of allowance");
        require(_maxSwapAmount >= 40*10**18, "Max Swap amount too small");
        maxSwapAmount = _maxSwapAmount;
        if (duration == SwapDuration.DAY) {
            swapPeriod = 1 days;
        } else if (duration == SwapDuration.WEEK) {
            swapPeriod = 7 days;
        } else if (duration == SwapDuration.EEK) {
            swapPeriod = 9 days;
        } else if (duration == SwapDuration.MOON) {
            swapPeriod = 29 days + 12 hours + 44 minutes + 2 seconds; // Approximation of 29.53 days
        } else {
            revert("Invalid swap duration.");
        }
    }
}