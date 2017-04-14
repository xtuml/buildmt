# S3 upload command  
#
# NOTE: The hudson build now runs this upload automatically
#
aws s3 sync /build/buildmt/hudson-home/jobs/BridgePoint/lastSuccessful/archive/bridgepoint/releng/org.xtuml.bp.releng.parent.product/target/products/ s3://xtuml-releases/nightly-build/  --grants read=uri=http://acs.amazonaws.com/groups/global/AllUsers 
